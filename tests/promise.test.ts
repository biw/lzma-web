import { describe, test, expect } from 'vitest'
import { compress, decompress } from '../src/index.js'
import LZMA from '../src/index.js'
import { compare } from './utils.js'

describe('Promise API', () => {
  describe('compress function', () => {
    test('returns Promise<Uint8Array>', async () => {
      const result = await compress('Hello, World!', 1)
      expect(result).toBeInstanceOf(Uint8Array)
    })

    test('compresses string data', async () => {
      const input = 'Hello, World!'
      const compressed = await compress(input, 1)
      expect(compressed.length).toBeGreaterThan(0)
    })

    test('compresses Uint8Array data', async () => {
      const input = new Uint8Array([1, 2, 3, 4, 5])
      const compressed = await compress(input, 1)
      expect(compressed).toBeInstanceOf(Uint8Array)
    })

    test('compresses ArrayBuffer data', async () => {
      const buffer = new ArrayBuffer(10)
      const view = new Uint8Array(buffer)
      view.set([0, 1, 2, 3, 4, 5, 6, 7, 8, 9])
      const compressed = await compress(buffer, 1)
      expect(compressed).toBeInstanceOf(Uint8Array)
    })

    test('uses default mode 9 when not specified', async () => {
      const input = 'Test data'
      const compressed = await compress(input)
      expect(compressed).toBeInstanceOf(Uint8Array)
    })
  })

  describe('decompress function', () => {
    test('returns Promise<string | Uint8Array>', async () => {
      const compressed = await compress('Hello, World!', 1)
      const result = await decompress(compressed)
      expect(typeof result === 'string' || result instanceof Uint8Array).toBe(
        true,
      )
    })

    test('decompresses to original string', async () => {
      const input = 'Hello, World!'
      const compressed = await compress(input, 1)
      const decompressed = await decompress(compressed)
      expect(decompressed).toBe(input)
    })

    test('decompresses to original binary', async () => {
      // Use bytes that form invalid UTF-8 sequences to ensure binary output
      const input = new Uint8Array([
        0xff, 0xfe, 0x00, 0x80, 0xc0, 0x81, 0x90, 0xa0, 0xb0, 0xc0,
      ])
      const compressed = await compress(input, 1)
      const decompressed = await decompress(compressed)
      expect(decompressed).toBeInstanceOf(Uint8Array)
      expect(compare(input, decompressed)).toBe(true)
    })

    test('decompresses from ArrayBuffer input', async () => {
      const input = 'Hello, ArrayBuffer!'
      const compressed = await compress(input, 1)
      const buffer = compressed.buffer.slice(
        compressed.byteOffset,
        compressed.byteOffset + compressed.byteLength,
      ) as ArrayBuffer
      const decompressed = await decompress(buffer)
      expect(decompressed).toBe(input)
    })
  })

  describe('progress callback', () => {
    test('calls progress callback during compression', async () => {
      const progressValues: number[] = []
      const input = 'A'.repeat(10000)
      await compress(input, 1, (p) => progressValues.push(p))

      expect(progressValues.length).toBeGreaterThan(0)
      // Progress should end at 1 (100%)
      expect(progressValues[progressValues.length - 1]).toBe(1)
    })

    test('progress values are between 0 and 1', async () => {
      const progressValues: number[] = []
      const input = 'A'.repeat(10000)
      await compress(input, 1, (p) => progressValues.push(p))

      for (const p of progressValues) {
        expect(p).toBeGreaterThanOrEqual(0)
        expect(p).toBeLessThanOrEqual(1)
      }
    })

    test('calls progress callback during decompression', async () => {
      const input = 'A'.repeat(10000)
      const compressed = await compress(input, 1)

      const progressValues: number[] = []
      await decompress(compressed, (p) => progressValues.push(p))

      expect(progressValues.length).toBeGreaterThan(0)
    })
  })

  describe('LZMA class', () => {
    test('instance can compress', async () => {
      const lzma = new LZMA()
      const result = await lzma.compress('Hello!', 1)
      expect(result).toBeInstanceOf(Uint8Array)
    })

    test('instance can decompress', async () => {
      const lzma = new LZMA()
      const compressed = await lzma.compress('Hello!', 1)
      const decompressed = await lzma.decompress(compressed)
      expect(decompressed).toBe('Hello!')
    })

    test('roundtrip with class', async () => {
      const lzma = new LZMA()
      const input = 'Test message for LZMA class'
      const compressed = await lzma.compress(input, 5)
      const decompressed = await lzma.decompress(compressed)
      expect(decompressed).toBe(input)
    })

    test('class supports progress callbacks', async () => {
      const lzma = new LZMA()
      const progressValues: number[] = []
      const input = 'A'.repeat(5000)
      await lzma.compress(input, 1, (p) => progressValues.push(p))
      expect(progressValues.length).toBeGreaterThan(0)
    })
  })

  describe('error handling', () => {
    test('rejects on invalid compressed data', async () => {
      const invalidData = new Uint8Array([0, 1, 2, 3, 4, 5])
      await expect(decompress(invalidData)).rejects.toThrow()
    })
  })

  describe('LZMA callback API (cb property)', () => {
    test('lzma.cb.compress works', () => {
      const lzma = new LZMA()
      const result = lzma.cb.compress('Hello!', 1)
      expect(result).toBeInstanceOf(Uint8Array)
    })

    test('lzma.cb.decompress works', () => {
      const lzma = new LZMA()
      const compressed = lzma.cb.compress('Hello!', 1)
      const result = lzma.cb.decompress(compressed as Uint8Array)
      expect(result).toBe('Hello!')
    })
  })

  describe('roundtrip', () => {
    test('all compression modes 1-9', async () => {
      const data = 'Test data for async compression modes'
      for (let mode = 1; mode <= 9; mode++) {
        const compressed = await compress(
          data,
          mode as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9,
        )
        const decompressed = await decompress(compressed)
        expect(decompressed).toBe(data)
      }
    })

    test('unicode text', async () => {
      const input = '你好世界！Hello World! Привет мир!'
      const compressed = await compress(input, 1)
      const decompressed = await decompress(compressed)
      expect(decompressed).toBe(input)
    })

    test('emoji text', async () => {
      const input = '🎉🎊🎁🎂🎈 Party time! 🥳'
      const compressed = await compress(input, 1)
      const decompressed = await decompress(compressed)
      expect(decompressed).toBe(input)
    })

    test('empty string', async () => {
      const input = ''
      const compressed = await compress(input, 1)
      const decompressed = await decompress(compressed)
      expect(decompressed).toBe(input)
    })

    test('large data', async () => {
      const input = 'A'.repeat(50000)
      const compressed = await compress(input, 1)
      const decompressed = await decompress(compressed)
      expect(decompressed).toBe(input)
    })

    test('JSON data', async () => {
      const input = JSON.stringify({
        name: 'Test',
        values: [1, 2, 3, 4, 5],
        nested: { a: 'b', c: [1, 2] },
      })
      const compressed = await compress(input, 1)
      const decompressed = await decompress(compressed)
      expect(decompressed).toBe(input)
    })

    test('whitespace and special characters', async () => {
      const input = '  spaces  \t\ttabs\n\nnewlines\r\nwindows\r'
      const compressed = await compress(input, 1)
      const decompressed = await decompress(compressed)
      expect(decompressed).toBe(input)
    })
  })

  describe('concurrent operations', () => {
    test('multiple concurrent compress operations', async () => {
      const inputs = ['data1', 'data2', 'data3', 'data4', 'data5']
      const results = await Promise.all(inputs.map((i) => compress(i, 1)))
      expect(results).toHaveLength(5)
      results.forEach((r) => expect(r).toBeInstanceOf(Uint8Array))
    })

    test('multiple concurrent decompress operations', async () => {
      const inputs = ['data1', 'data2', 'data3', 'data4', 'data5']
      const compressed = await Promise.all(inputs.map((i) => compress(i, 1)))
      const decompressed = await Promise.all(
        compressed.map((c) => decompress(c)),
      )
      expect(decompressed).toEqual(inputs)
    })
  })
})
