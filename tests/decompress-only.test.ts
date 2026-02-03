import { describe, test, expect } from 'vitest'
import { decompressSync, decompressAsync } from '../src/decompress.js'
import { compress } from '../src/index.js'
import { compressSync } from '../src/sync.js'
import { compare } from './utils.js'

describe('Decompress-Only Module (lzma-web/decompress)', () => {
  describe('decompressSync', () => {
    test('returns string for text data', async () => {
      const input = 'Hello, World!'
      const compressed = await compress(input, 1)
      const result = decompressSync(compressed)
      expect(typeof result).toBe('string')
      expect(result).toBe(input)
    })

    test('returns Uint8Array for binary data', async () => {
      // Use bytes that form invalid UTF-8 sequences
      const input = new Uint8Array([
        0xff, 0xfe, 0x00, 0x80, 0xc0, 0x81, 0x90, 0xa0, 0xb0, 0xc0,
      ])
      const compressed = await compress(input, 1)
      const result = decompressSync(compressed)
      expect(result).toBeInstanceOf(Uint8Array)
      expect(compare(input, result)).toBe(true)
    })

    test('decompresses empty string', async () => {
      const input = ''
      const compressed = await compress(input, 1)
      const result = decompressSync(compressed)
      expect(result).toBe(input)
    })

    test('decompresses unicode text', async () => {
      const input = '你好世界！Hello World! Привет мир! 🌍🌎🌏'
      const compressed = await compress(input, 1)
      const result = decompressSync(compressed)
      expect(result).toBe(input)
    })

    test('decompresses large data', async () => {
      const input = 'A'.repeat(100000)
      const compressed = await compress(input, 1)
      const result = decompressSync(compressed)
      expect(result).toBe(input)
    })
  })

  describe('decompressAsync', () => {
    test('returns Promise<string | Uint8Array>', async () => {
      const input = 'Hello, World!'
      const compressed = await compress(input, 1)
      const result = await decompressAsync(compressed)
      expect(typeof result === 'string' || result instanceof Uint8Array).toBe(
        true,
      )
    })

    test('decompresses to original string', async () => {
      const input = 'Hello, World!'
      const compressed = await compress(input, 1)
      const result = await decompressAsync(compressed)
      expect(result).toBe(input)
    })

    test('decompresses to original binary', async () => {
      const input = new Uint8Array([
        0xff, 0xfe, 0x00, 0x80, 0xc0, 0x81, 0x90, 0xa0, 0xb0, 0xc0,
      ])
      const compressed = await compress(input, 1)
      const result = await decompressAsync(compressed)
      expect(result).toBeInstanceOf(Uint8Array)
      expect(compare(input, result)).toBe(true)
    })

    test('calls progress callback', async () => {
      const input = 'A'.repeat(10000)
      const compressed = await compress(input, 1)
      const progressValues: number[] = []

      await decompressAsync(compressed, (p) => progressValues.push(p))

      expect(progressValues.length).toBeGreaterThan(0)
    })

    test('progress values are valid numbers', async () => {
      const input = 'A'.repeat(10000)
      const compressed = await compress(input, 1)
      const progressValues: number[] = []

      await decompressAsync(compressed, (p) => progressValues.push(p))

      for (const p of progressValues) {
        expect(typeof p).toBe('number')
        // Progress can be -1 if size is unknown, or between 0 and 1
        expect(p === -1 || (p >= 0 && p <= 1)).toBe(true)
      }
    })
  })

  describe('cross-module compatibility', () => {
    test('main module compress output can be decompressed by decompressSync', async () => {
      const input = 'Cross-module test data'
      const compressed = await compress(input, 1)
      const decompressed = decompressSync(compressed)
      expect(decompressed).toBe(input)
    })

    test('sync compressSync output can be decompressed by decompressSync', () => {
      const input = 'Sync cross-module test data'
      const compressed = compressSync(input, 1)
      const decompressed = decompressSync(compressed)
      expect(decompressed).toBe(input)
    })

    test('main module compress output can be decompressed by decompressAsync', async () => {
      const input = 'Async cross-module test data'
      const compressed = await compress(input, 1)
      const decompressed = await decompressAsync(compressed)
      expect(decompressed).toBe(input)
    })

    test('all compression modes can be decompressed', async () => {
      const input = 'Test data for all modes'
      for (let mode = 1; mode <= 9; mode++) {
        const compressed = await compress(
          input,
          mode as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9,
        )
        const decompressed = decompressSync(compressed)
        expect(decompressed).toBe(input)
      }
    })

    test('unicode roundtrip across modules', () => {
      const input = '你好世界！Hello World! Привет мир! 🌍🌎🌏'
      const compressed = compressSync(input, 1)
      const decompressed = decompressSync(compressed)
      expect(decompressed).toBe(input)
    })

    test('binary roundtrip across modules', () => {
      const input = new Uint8Array([
        0xff, 0xfe, 0x00, 0x80, 0xc0, 0x81, 0x90, 0xa0, 0xb0, 0xc0,
      ])
      const compressed = compressSync(input, 1)
      const decompressed = decompressSync(compressed)
      expect(decompressed).toBeInstanceOf(Uint8Array)
      expect(compare(input, decompressed)).toBe(true)
    })
  })

  describe('error handling', () => {
    test('decompressSync throws on invalid data', () => {
      const invalidData = new Uint8Array([0, 1, 2, 3, 4, 5])
      expect(() => decompressSync(invalidData)).toThrow()
    })

    test('decompressAsync rejects on invalid data', async () => {
      const invalidData = new Uint8Array([0, 1, 2, 3, 4, 5])
      await expect(decompressAsync(invalidData)).rejects.toThrow()
    })
  })

  describe('type exports', () => {
    test('OnProgressCallback type is available', async () => {
      // TypeScript compile-time check
      const callback: import('../src/decompress.js').OnProgressCallback = (
        _p,
      ) => {}
      const input = 'Type test'
      const compressed = await compress(input, 1)
      await decompressAsync(compressed, callback)
    })
  })
})
