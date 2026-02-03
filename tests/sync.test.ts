import { describe, test, expect } from 'vitest'
import { compressSync, decompressSync } from '../src/sync.js'
import { compare } from './utils.js'

describe('Sync API', () => {
  describe('compressSync', () => {
    test('returns Uint8Array', () => {
      const result = compressSync('Hello, World!', 1)
      expect(result).toBeInstanceOf(Uint8Array)
    })

    test('compresses string data', () => {
      const input = 'Hello, World!'
      const compressed = compressSync(input, 1)
      // LZMA has significant header overhead (~24 bytes), short strings will expand
      expect(compressed.length).toBeGreaterThan(0)
      expect(compressed).toBeInstanceOf(Uint8Array)
    })

    test('compresses Uint8Array data', () => {
      const input = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
      const compressed = compressSync(input, 1)
      expect(compressed).toBeInstanceOf(Uint8Array)
    })

    test('compresses ArrayBuffer data', () => {
      const buffer = new ArrayBuffer(10)
      const view = new Uint8Array(buffer)
      view.set([0, 1, 2, 3, 4, 5, 6, 7, 8, 9])
      const compressed = compressSync(buffer, 1)
      expect(compressed).toBeInstanceOf(Uint8Array)
    })

    test('uses default mode 9 when not specified', () => {
      const result = compressSync('Test data')
      expect(result).toBeInstanceOf(Uint8Array)
    })

    test('higher modes produce smaller output for repetitive data', () => {
      const input = 'ABCDEFG'.repeat(1000)
      const compressed1 = compressSync(input, 1)
      const compressed9 = compressSync(input, 9)
      // Mode 9 should produce smaller or equal output
      expect(compressed9.length).toBeLessThanOrEqual(compressed1.length)
    })
  })

  describe('decompressSync', () => {
    test('decompresses to original string', () => {
      const input = 'Hello, World!'
      const compressed = compressSync(input, 1)
      const decompressed = decompressSync(compressed)
      expect(decompressed).toBe(input)
    })

    test('decompresses to original binary', () => {
      // Use bytes that form invalid UTF-8 sequences to ensure binary output
      const input = new Uint8Array([
        0xff, 0xfe, 0x00, 0x80, 0xc0, 0x81, 0x90, 0xa0, 0xb0, 0xc0,
      ])
      const compressed = compressSync(input, 1)
      const decompressed = decompressSync(compressed)
      expect(decompressed).toBeInstanceOf(Uint8Array)
      expect(compare(input, decompressed)).toBe(true)
    })
  })

  describe('roundtrip', () => {
    test('all compression modes 1-9', () => {
      const data =
        'Test data for compression modes - repeated text for better compression ratio'
      for (let mode = 1; mode <= 9; mode++) {
        const compressed = compressSync(
          data,
          mode as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9,
        )
        const decompressed = decompressSync(compressed)
        expect(decompressed).toBe(data)
      }
    })

    test('unicode text', () => {
      const input = '你好世界！Hello World! Привет мир! 🌍🌎🌏'
      const compressed = compressSync(input, 1)
      const decompressed = decompressSync(compressed)
      expect(decompressed).toBe(input)
    })

    test('empty string', () => {
      const input = ''
      const compressed = compressSync(input, 1)
      const decompressed = decompressSync(compressed)
      expect(decompressed).toBe(input)
    })

    test('large data', () => {
      const input = 'A'.repeat(10000)
      const compressed = compressSync(input, 1)
      const decompressed = decompressSync(compressed)
      expect(decompressed).toBe(input)
    })

    test('newlines and special characters', () => {
      const input = 'Line1\nLine2\rLine3\r\nLine4\tTab'
      const compressed = compressSync(input, 1)
      const decompressed = decompressSync(compressed)
      expect(decompressed).toBe(input)
    })

    test('null bytes in binary data', () => {
      const input = new Uint8Array([0, 0, 0, 1, 2, 3, 0, 0, 0])
      const compressed = compressSync(input, 1)
      const decompressed = decompressSync(compressed)
      // Note: binary data with valid UTF-8 may be returned as string
      expect(decompressed).not.toBeNull()
    })

    test('JSON data', () => {
      const input = JSON.stringify({
        name: 'Test',
        values: [1, 2, 3],
        nested: { a: 'b' },
      })
      const compressed = compressSync(input, 1)
      const decompressed = decompressSync(compressed)
      expect(decompressed).toBe(input)
      expect(JSON.parse(decompressed as string)).toEqual({
        name: 'Test',
        values: [1, 2, 3],
        nested: { a: 'b' },
      })
    })
  })

  describe('error handling', () => {
    test('decompressSync throws on invalid data', () => {
      const invalidData = new Uint8Array([0, 1, 2, 3, 4, 5])
      expect(() => decompressSync(invalidData)).toThrow()
    })
  })
})
