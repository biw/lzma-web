import { afterEach, describe, expect, test } from 'vitest'
import { compress, decompress } from 'lzma-web'
import { createWorkerLZMA } from 'lzma-web/worker'
import { compressSync, decompressSync } from 'lzma-web/sync'
import {
  compress as compressOnly,
  compressAsync,
  compressSync as compressOnlySync,
} from 'lzma-web/compress'
import {
  decompress as decompressOnly,
  decompressAsync,
  decompressSync as decompressOnlySync,
} from 'lzma-web/decompress'

describe('packed lzma-web consumer', () => {
  let lzma

  afterEach(() => {
    lzma?.terminate()
    lzma = undefined
  })

  test('loads the default Promise entry point from the tarball', async () => {
    const input = 'Default entry point from an npm tarball: \ud83c\udf0d'
    const compressed = await compress(input, 1)

    expect(compressed).toBeInstanceOf(Uint8Array)
    await expect(decompress(compressed)).resolves.toBe(input)
  })

  test('loads the published Worker entry point and round-trips data', async () => {
    lzma = createWorkerLZMA()
    expect(lzma.worker).toBeNull()

    const input = 'Worker entry point from an npm tarball: \ud83c\udf0d'
    const compressed = await lzma.compress(input, 9)

    expect(lzma.worker).toBeInstanceOf(Worker)
    expect(compressed).toBeInstanceOf(Uint8Array)
    await expect(lzma.decompress(compressed)).resolves.toBe(input)
  })

  test('loads the published synchronous entry point', () => {
    const input = 'Synchronous entry point from an npm tarball'
    const compressed = compressSync(input, 1)

    expect(compressed).toBeInstanceOf(Uint8Array)
    expect(decompressSync(compressed)).toBe(input)
  })

  test('loads every compression-only export from the tarball', async () => {
    const input = 'Compression-only entry point from an npm tarball'

    expect(compressOnly(input, 1)).toBeInstanceOf(Uint8Array)
    expect(compressOnlySync(input, 1)).toBeInstanceOf(Uint8Array)
    await expect(compressAsync(input, 1)).resolves.toBeInstanceOf(Uint8Array)
  })

  test('loads every decompression-only export from the tarball', async () => {
    const input = 'Decompression-only entry point from an npm tarball'
    const compressed = compressSync(input, 1)

    expect(decompressOnly(compressed)).toBe(input)
    expect(decompressOnlySync(compressed)).toBe(input)
    await expect(decompressAsync(compressed)).resolves.toBe(input)
  })
})
