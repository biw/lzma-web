import { app } from 'electron'
import { compress, decompress } from 'lzma-web'

process.on('uncaughtException', (error) => {
  console.error('SMOKE_FAIL uncaughtException', error)
  app.exit(1)
})

process.on('unhandledRejection', (error) => {
  console.error('SMOKE_FAIL unhandledRejection', error)
  app.exit(1)
})

app.disableHardwareAcceleration()

app.whenReady().then(async () => {
  const input = 'electron packaged smoke test'
  const compressed = await compress(input, 1)
  const decompressed = await decompress(compressed)

  if (decompressed !== input) {
    throw new Error(`roundtrip failed: ${String(decompressed)}`)
  }

  console.log('SMOKE_OK')
  app.exit(0)
})
