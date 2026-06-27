#!/usr/bin/env node

import { spawnSync } from 'node:child_process'
import {
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  rmSync,
} from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const repoRoot = path.resolve(__dirname, '..')
const fixtureDir = path.join(repoRoot, 'tests', 'fixtures', 'electron-smoke')
const tempRoot = mkdtempSync(path.join(os.tmpdir(), 'lzma-web-electron-'))
const packageDir = path.join(tempRoot, 'package')
const appDir = path.join(tempRoot, 'app')
const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm'
const npxCmd = process.platform === 'win32' ? 'npx.cmd' : 'npx'
const electronVersion = '35.7.5'

function run(command, args, cwd, options = {}) {
  const result = spawnSync(command, args, {
    cwd,
    encoding: 'utf8',
    stdio: options.captureOutput ? 'pipe' : 'inherit',
    timeout: options.timeoutMs,
    env: {
      ...process.env,
      CI: process.env.CI ?? 'true',
    },
  })

  if (result.error) throw result.error
  if (result.status !== 0) {
    if (options.captureOutput) {
      if (result.stdout) process.stdout.write(result.stdout)
      if (result.stderr) process.stderr.write(result.stderr)
    }

    throw new Error(
      `${command} ${args.join(' ')} failed with exit code ${String(result.status)}`,
    )
  }

  return result
}

function getPackedBinaryPath(packagedDir) {
  if (process.platform === 'darwin') {
    return path.join(
      packagedDir,
      'lzma-web-smoke.app',
      'Contents',
      'MacOS',
      'lzma-web-smoke',
    )
  }

  if (process.platform === 'win32') {
    return path.join(packagedDir, 'lzma-web-smoke.exe')
  }

  return path.join(packagedDir, 'lzma-web-smoke')
}

function getPackagedAppDir(outDir) {
  const entry = readdirSync(outDir).find((name) =>
    name.startsWith(`lzma-web-smoke-${process.platform}`),
  )

  if (!entry) {
    throw new Error(`Could not find packaged app in ${outDir}`)
  }

  return path.join(outDir, entry)
}

try {
  mkdirSync(packageDir, { recursive: true })
  cpSync(fixtureDir, appDir, { recursive: true })

  run(npmCmd, ['pack', '--ignore-scripts', '--pack-destination', packageDir], repoRoot)

  const tarballName = readdirSync(packageDir).find((name) => name.endsWith('.tgz'))
  if (!tarballName) {
    throw new Error('npm pack did not produce a package tarball')
  }

  const tarballPath = path.join(packageDir, tarballName)

  run(
    npmCmd,
    [
      'install',
      '--no-package-lock',
      '--no-save',
      tarballPath,
      `electron@${electronVersion}`,
      '@electron/packager@18.3.6',
    ],
    appDir,
  )

  run(
    npxCmd,
    [
      'electron-packager',
      '.',
      'lzma-web-smoke',
      `--platform=${process.platform}`,
      `--arch=${process.arch}`,
      `--electron-version=${electronVersion}`,
      '--out=out',
      '--overwrite',
      '--asar',
    ],
    appDir,
  )

  const packagedDir = getPackagedAppDir(path.join(appDir, 'out'))
  const binaryPath = getPackedBinaryPath(packagedDir)

  if (!existsSync(binaryPath)) {
    throw new Error(`Packaged Electron binary not found at ${binaryPath}`)
  }

  const launchCommand =
    process.platform === 'linux' && process.env.DISPLAY === undefined
      ? existsSync('/usr/bin/xvfb-run') || existsSync('/bin/xvfb-run')
        ? (process.platform === 'win32' ? 'xvfb-run.cmd' : 'xvfb-run')
        : binaryPath
      : binaryPath

  const launchArgs =
    launchCommand === binaryPath
      ? ['--no-sandbox']
      : ['-a', binaryPath, '--no-sandbox']

  const result = run(launchCommand, launchArgs, appDir, {
    captureOutput: true,
    timeoutMs: 60_000,
  })

  const combinedOutput = `${result.stdout}\n${result.stderr}`

  if (!combinedOutput.includes('SMOKE_OK')) {
    process.stdout.write(result.stdout)
    process.stderr.write(result.stderr)
    throw new Error('Packaged Electron app did not report SMOKE_OK')
  }

  process.stdout.write(result.stdout)
  process.stderr.write(result.stderr)
} finally {
  rmSync(tempRoot, { recursive: true, force: true })
}
