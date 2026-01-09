import { describe, test, expect } from 'vitest'
import { compress, compressSync, compressAsync } from '../src/compress.js'
import { decompress } from '../src/index.js'
import { decompressSync } from '../src/sync.js'

describe('Compress-Only Module (lzma-web/compress)', () => {
  describe('compress (raw function)', () => {
    test('exports compress function', () => {
      expect(typeof compress).toBe('function')
    })

    test('compresses string synchronously without callback', () => {
      const result = compress('Hello, World!', 1)
      expect(result).toBeInstanceOf(Uint8Array)
    })

    test('compresses Uint8Array synchronously', () => {
      const input = new Uint8Array([1, 2, 3, 4, 5])
      const result = compress(input, 1)
      expect(result).toBeInstanceOf(Uint8Array)
    })

    test('compresses ArrayBuffer input', () => {
      const buffer = new ArrayBuffer(10)
      const view = new Uint8Array(buffer)
      view.set([0, 1, 2, 3, 4, 5, 6, 7, 8, 9])
      const result = compress(buffer, 1)
      expect(result).toBeInstanceOf(Uint8Array)
    })
  })

  describe('compressSync', () => {
    test('returns Uint8Array', () => {
      const result = compressSync('Hello, World!', 1)
      expect(result).toBeInstanceOf(Uint8Array)
    })

    test('compresses string data', () => {
      const input = 'Hello, World!'
      const compressed = compressSync(input, 1)
      expect(compressed.length).toBeGreaterThan(0)
      expect(compressed).toBeInstanceOf(Uint8Array)
    })

    test('compresses Uint8Array data', () => {
      const input = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
      const compressed = compressSync(input, 1)
      expect(compressed).toBeInstanceOf(Uint8Array)
    })

    test('uses default mode 9 when not specified', () => {
      const result = compressSync('Test data')
      expect(result).toBeInstanceOf(Uint8Array)
    })

    test('compresses empty string', () => {
      const result = compressSync('', 1)
      expect(result).toBeInstanceOf(Uint8Array)
    })

    test('compresses unicode text', () => {
      const input = '你好世界！Hello World! Привет мир! 🌍🌎🌏'
      const result = compressSync(input, 1)
      expect(result).toBeInstanceOf(Uint8Array)
    })

    test('compresses large data', () => {
      const input = 'A'.repeat(100000)
      const result = compressSync(input, 1)
      expect(result).toBeInstanceOf(Uint8Array)
      // Large repetitive data should compress well
      expect(result.length).toBeLessThan(input.length)
    })

    test('all compression modes 1-9', () => {
      const input = 'Test data for all modes - repeated content for compression'
      for (let mode = 1; mode <= 9; mode++) {
        const result = compressSync(
          input,
          mode as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9,
        )
        expect(result).toBeInstanceOf(Uint8Array)
      }
    })
  })

  describe('compressAsync', () => {
    test('returns Promise<Uint8Array>', async () => {
      const result = await compressAsync('Hello, World!', 1)
      expect(result).toBeInstanceOf(Uint8Array)
    })

    test('compresses string data', async () => {
      const input = 'Hello, World!'
      const compressed = await compressAsync(input, 1)
      expect(compressed.length).toBeGreaterThan(0)
    })

    test('compresses Uint8Array data', async () => {
      const input = new Uint8Array([1, 2, 3, 4, 5])
      const compressed = await compressAsync(input, 1)
      expect(compressed).toBeInstanceOf(Uint8Array)
    })

    test('uses default mode 9 when not specified', async () => {
      const result = await compressAsync('Test data')
      expect(result).toBeInstanceOf(Uint8Array)
    })

    test('calls progress callback', async () => {
      const progressValues: number[] = []
      const input = 'A'.repeat(10000)
      await compressAsync(input, 1, (p) => progressValues.push(p))

      expect(progressValues.length).toBeGreaterThan(0)
      expect(progressValues[progressValues.length - 1]).toBe(1)
    })

    test('progress values are between 0 and 1', async () => {
      const progressValues: number[] = []
      const input = 'A'.repeat(10000)
      await compressAsync(input, 1, (p) => progressValues.push(p))

      for (const p of progressValues) {
        expect(p).toBeGreaterThanOrEqual(0)
        expect(p).toBeLessThanOrEqual(1)
      }
    })
  })

  describe('cross-module compatibility', () => {
    test('compressSync output can be decompressed by main module decompress', async () => {
      const input = 'Cross-module test data'
      const compressed = compressSync(input, 1)
      const decompressed = await decompress(compressed)
      expect(decompressed).toBe(input)
    })

    test('compressSync output can be decompressed by sync decompressSync', () => {
      const input = 'Cross-module sync test data'
      const compressed = compressSync(input, 1)
      const decompressed = decompressSync(compressed)
      expect(decompressed).toBe(input)
    })

    test('compressAsync output can be decompressed by main module', async () => {
      const input = 'Async cross-module test data'
      const compressed = await compressAsync(input, 1)
      const decompressed = await decompress(compressed)
      expect(decompressed).toBe(input)
    })

    test('unicode roundtrip across modules', async () => {
      const input = '你好世界！Hello World! Привет мир! 🌍🌎🌏'
      const compressed = compressSync(input, 1)
      const decompressed = await decompress(compressed)
      expect(decompressed).toBe(input)
    })

    test('binary roundtrip across modules', async () => {
      // Use bytes that form invalid UTF-8 sequences to ensure binary output
      const input = new Uint8Array([
        0xff, 0xfe, 0x00, 0x80, 0xc0, 0x81, 0x90, 0xa0, 0xb0, 0xc0,
      ])
      const compressed = compressSync(input, 1)
      const decompressed = await decompress(compressed)
      expect(decompressed).toBeInstanceOf(Uint8Array)
      expect(
        (decompressed as Uint8Array).length === input.length &&
          (decompressed as Uint8Array).every((v, i) => v === input[i]),
      ).toBe(true)
    })
  })

  describe('type exports', () => {
    test('CompressMode type is available', async () => {
      // TypeScript compile-time check - if this compiles, the type exists
      const mode: import('../src/compress.js').CompressMode = 5
      const result = compressSync('test', mode)
      expect(result).toBeInstanceOf(Uint8Array)
    })

    test('OnProgressCallback type is available', async () => {
      // TypeScript compile-time check
      const callback: import('../src/compress.js').OnProgressCallback = (
        _p,
      ) => {}
      await compressAsync('A'.repeat(1000), 1, callback)
    })
  })
})
