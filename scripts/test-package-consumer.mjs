import { execFileSync } from 'node:child_process'
import assert from 'node:assert/strict'
import {
  mkdirSync,
  mkdtempSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import * as esbuild from 'esbuild'

const repositoryRoot = process.cwd()
const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm'
const tempDirectory = mkdtempSync(join(tmpdir(), 'lzma-web-package-consumer-'))
const consumerDirectory = join(tempDirectory, 'consumer')
const packDirectory = join(tempDirectory, 'pack')

mkdirSync(consumerDirectory)
mkdirSync(packDirectory)

function run(command, args, cwd) {
  return execFileSync(command, args, { cwd, encoding: 'utf8' })
}

function parseJsonArray(output) {
  // npm 8 prints lifecycle output before --json output. The package test must
  // support the minimum Node/npm environment we document, while still parsing
  // npm's trailing JSON array on newer versions.
  const match = output.match(/(?:^|\n)(\[[\s\S]*\])\s*$/)
  if (!match) {
    throw new Error(`npm did not return a JSON array:\n${output}`)
  }
  return JSON.parse(match[1])
}

function runNode(args) {
  execFileSync(process.execPath, args, {
    cwd: consumerDirectory,
    stdio: 'inherit',
  })
}

async function bundleConsumer(source) {
  const result = await esbuild.build({
    stdin: {
      contents: source,
      resolveDir: consumerDirectory,
      sourcefile: 'consumer-entry.js',
    },
    bundle: true,
    format: 'esm',
    platform: 'browser',
    minify: true,
    treeShaking: true,
    write: false,
    logLevel: 'silent',
  })

  return result.outputFiles[0].contents.byteLength
}

try {
  const packed = parseJsonArray(
    run(
      npm,
      ['pack', '--json', '--ignore-scripts', '--pack-destination', packDirectory],
      repositoryRoot,
    ),
  )
  const tarball = packed[0]?.filename

  if (!tarball || !readdirSync(packDirectory).includes(tarball)) {
    throw new Error('npm pack did not create a tarball')
  }

  writeFileSync(
    join(consumerDirectory, 'package.json'),
    JSON.stringify({ name: 'lzma-web-package-consumer', private: true, type: 'module' }),
  )
  run(
    npm,
    [
      'install',
      '--ignore-scripts',
      '--no-audit',
      '--no-fund',
      '--no-package-lock',
      '--no-save',
      join(packDirectory, tarball),
    ],
    consumerDirectory,
  )

  runNode([
    '--input-type=module',
    '--eval',
    `
      import assert from 'node:assert/strict'
      import { compress, decompress } from 'lzma-web'
      import { compressSync, decompressSync } from 'lzma-web/sync'
      import { compress as compressOnly, compressAsync, compressSync as compressOnlySync } from 'lzma-web/compress'
      import { decompress as decompressOnly, decompressAsync, decompressSync as decompressOnlySync } from 'lzma-web/decompress'
      import { createWorkerLZMA } from 'lzma-web/worker'

      const input = 'ESM consumer from an npm tarball: 🌍'
      const rootCompressed = await compress(input, 1)
      assert.equal(await decompress(rootCompressed), input)

      const syncCompressed = compressSync(input, 1)
      assert.equal(decompressSync(syncCompressed), input)

      const rawCompressed = compressOnly(input, 1)
      assert(rawCompressed instanceof Uint8Array)
      assert(compressOnlySync(input, 1) instanceof Uint8Array)
      assert(await compressAsync(input, 1) instanceof Uint8Array)

      assert.equal(decompressOnly(syncCompressed), input)
      assert.equal(decompressOnlySync(syncCompressed), input)
      assert.equal(await decompressAsync(syncCompressed), input)

      const worker = createWorkerLZMA()
      assert.equal(worker.worker, null)
    `,
  ])

  runNode([
    '--input-type=commonjs',
    '--eval',
    `
      const assert = require('node:assert/strict')
      const main = require('lzma-web')
      const sync = require('lzma-web/sync')
      const compressOnly = require('lzma-web/compress')
      const decompressOnly = require('lzma-web/decompress')
      const workerApi = require('lzma-web/worker')

      ;(async () => {
        const input = 'CommonJS consumer from an npm tarball: 🌍'
        const rootCompressed = await main.compress(input, 1)
        assert.equal(await main.decompress(rootCompressed), input)

        const syncCompressed = sync.compressSync(input, 1)
        assert.equal(sync.decompressSync(syncCompressed), input)

        assert(compressOnly.compress(input, 1) instanceof Uint8Array)
        assert(compressOnly.compressSync(input, 1) instanceof Uint8Array)
        assert(await compressOnly.compressAsync(input, 1) instanceof Uint8Array)

        assert.equal(decompressOnly.decompress(syncCompressed), input)
        assert.equal(decompressOnly.decompressSync(syncCompressed), input)
        assert.equal(await decompressOnly.decompressAsync(syncCompressed), input)

        assert.equal(typeof workerApi.createWorkerLZMA, 'function')
      })().catch((error) => {
        console.error(error)
        process.exitCode = 1
      })
    `,
  ])

  writeFileSync(
    join(consumerDirectory, 'consumer.mts'),
    `
      import { compress, decompress } from 'lzma-web'
      import { compressSync, decompressSync } from 'lzma-web/sync'
      import { compress as compressOnly, compressAsync, compressSync as compressOnlySync } from 'lzma-web/compress'
      import { decompress as decompressOnly, decompressAsync, decompressSync as decompressOnlySync } from 'lzma-web/decompress'
      import { createWorkerLZMA, type WorkerLZMA } from 'lzma-web/worker'

      const input = 'TypeScript consumer'
      const mainCompressed: Promise<Uint8Array> = compress(input, 1)
      const mainDecompressed: Promise<string | Uint8Array> = decompress(await mainCompressed)
      const syncCompressed: Uint8Array = compressSync(input, 1)
      const syncDecompressed: string | Uint8Array = decompressSync(syncCompressed)
      const rawCompressed: Uint8Array = compressOnly(input, 1)
      const compressed: Promise<Uint8Array> = compressAsync(input, 1)
      const compressionSync: Uint8Array = compressOnlySync(input, 1)
      const rawDecompressed: string | Uint8Array = decompressOnly(rawCompressed)
      const decompressed: Promise<string | Uint8Array> = decompressAsync(rawCompressed)
      const decompressionSync: string | Uint8Array = decompressOnlySync(rawCompressed)
      const worker: WorkerLZMA = createWorkerLZMA()

      void [mainDecompressed, syncDecompressed, compressed, compressionSync, rawDecompressed, decompressed, decompressionSync, worker]
    `,
  )
  runNode([
    join(repositoryRoot, 'node_modules', 'typescript', 'bin', 'tsc'),
    '--noEmit',
    '--strict',
    '--target',
    'ES2020',
    '--module',
    'NodeNext',
    '--moduleResolution',
    'NodeNext',
    'consumer.mts',
  ])

  const unusedImport = await bundleConsumer(
    "import { compress } from 'lzma-web/compress'; console.log('tree-shaken')",
  )
  const rootCompress = await bundleConsumer(
    "import { compress } from 'lzma-web'; console.log(compress)",
  )
  const rootBoth = await bundleConsumer(
    "import { compress, decompress } from 'lzma-web'; console.log(compress, decompress)",
  )
  const syncCompress = await bundleConsumer(
    "import { compressSync } from 'lzma-web/sync'; console.log(compressSync)",
  )
  const compressOnly = await bundleConsumer(
    "import { compress } from 'lzma-web/compress'; console.log(compress)",
  )
  const decompressOnly = await bundleConsumer(
    "import { decompress } from 'lzma-web/decompress'; console.log(decompress)",
  )
  const worker = await bundleConsumer(
    "import { createWorkerLZMA } from 'lzma-web/worker'; console.log(createWorkerLZMA)",
  )

  assert.ok(
    unusedImport < 100,
    `unused imports should be removed entirely; bundled ${unusedImport} bytes`,
  )
  assert.ok(
    rootBoth - rootCompress >= 4_000,
    `root named imports should remove decompression code; saved ${rootBoth - rootCompress} bytes`,
  )
  assert.ok(
    compressOnly <= rootCompress + 1_024,
    `compression-only entry point should not exceed the root compression bundle (${compressOnly} bytes)`,
  )
  assert.ok(
    decompressOnly < compressOnly * 0.6,
    `decompression-only entry point should exclude compression code (${decompressOnly} bytes)`,
  )
  assert.ok(
    syncCompress <= rootBoth - 4_000,
    `sync entry point should not include the full default API (${syncCompress} bytes)`,
  )
  assert.ok(
    worker > syncCompress,
    'worker entry point should retain its self-contained Worker payload',
  )

  console.log('Package consumer and tree-shaking tests passed')
} finally {
  rmSync(tempDirectory, { recursive: true, force: true })
}
