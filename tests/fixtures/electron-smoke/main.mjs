import { app, BrowserWindow } from 'electron'
import { compress, decompress } from 'lzma-web'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

process.on('uncaughtException', (error) => {
  console.error('SMOKE_FAIL uncaughtException', error)
  app.exit(1)
})

process.on('unhandledRejection', (error) => {
  console.error('SMOKE_FAIL unhandledRejection', error)
  app.exit(1)
})

app.disableHardwareAcceleration()

function runRendererWorkerSmoke() {
  return new Promise((resolve, reject) => {
    const window = new BrowserWindow({
      show: false,
      webPreferences: {
        contextIsolation: true,
        nodeIntegration: false,
      },
    })
    let finished = false

    const finish = (error) => {
      if (finished) return
      finished = true
      clearTimeout(timeout)

      if (!window.isDestroyed()) {
        window.destroy()
      }

      if (error) reject(error)
      else resolve()
    }

    const timeout = setTimeout(() => {
      finish(new Error('renderer Worker smoke test timed out'))
    }, 30_000)

    window.webContents.on('console-message', ({ message }) => {
      if (message === 'RENDERER_SMOKE_OK') finish()
      if (message.startsWith('RENDERER_SMOKE_FAIL ')) {
        finish(new Error(message))
      }
    })

    window.webContents.once(
      'did-fail-load',
      (_event, errorCode, errorDescription, validatedURL, isMainFrame) => {
        if (isMainFrame) {
          finish(
            new Error(
              `renderer failed to load ${validatedURL} (${errorCode}: ${errorDescription})`,
            ),
          )
        }
      },
    )

    window.loadFile(path.join(__dirname, 'renderer.html')).catch(finish)
  })
}

app.whenReady().then(async () => {
  const input = 'electron main-process smoke test'
  const compressed = await compress(input, 1)
  const decompressed = await decompress(compressed)

  if (decompressed !== input) {
    throw new Error(`roundtrip failed: ${String(decompressed)}`)
  }

  await runRendererWorkerSmoke()

  console.log('SMOKE_OK')
  app.exit(0)
})
