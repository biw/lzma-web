import { execFileSync } from 'node:child_process'
import { mkdtempSync, readdirSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const fixtureDirectory = join(
  repositoryRoot,
  'tests',
  'fixtures',
  'browser-consumer',
)
const fixtureNodeModules = join(fixtureDirectory, 'node_modules')
const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm'

function runNpm(args: string[], cwd: string): string {
  return execFileSync(npm, args, { cwd, encoding: 'utf8' })
}

export default function setupBrowserConsumer() {
  const packDirectory = mkdtempSync(
    join(tmpdir(), 'lzma-web-browser-consumer-'),
  )

  try {
    const metadata = JSON.parse(
      runNpm(
        [
          'pack',
          '--json',
          '--ignore-scripts',
          '--pack-destination',
          packDirectory,
        ],
        repositoryRoot,
      ),
    ) as Array<{ filename: string }> | Record<string, { filename: string }>
    const packed = Array.isArray(metadata) ? metadata : Object.values(metadata)
    const tarball = packed[0]?.filename

    if (!tarball || !readdirSync(packDirectory).includes(tarball)) {
      throw new Error('npm pack did not create a tarball')
    }

    runNpm(
      [
        'install',
        '--ignore-scripts',
        '--no-audit',
        '--no-fund',
        '--no-package-lock',
        '--no-save',
        join(packDirectory, tarball),
      ],
      fixtureDirectory,
    )
  } catch (error) {
    rmSync(fixtureNodeModules, { recursive: true, force: true })
    rmSync(packDirectory, { recursive: true, force: true })
    throw error
  }

  return () => {
    rmSync(fixtureNodeModules, { recursive: true, force: true })
    rmSync(packDirectory, { recursive: true, force: true })
  }
}
