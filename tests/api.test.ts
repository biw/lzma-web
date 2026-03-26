/**
 * Comprehensive API tests for lzma-web
 *
 * These tests cover the full API surface to ensure behavior is preserved
 * during refactoring. They test:
 * - Promise-based API (compress/decompress from index.ts)
 * - Callback-based API (lzma_main.ts directly)
 * - Synchronous API (lzma_main.ts)
 * - All compression modes (1-9)
 * - Different input types (string, Uint8Array, Buffer)
 * - Edge cases (unicode, binary, large data)
 * - Error handling
 * - Progress callbacks
 */

import { describe, test, expect } from 'vitest'
import { compress, decompress } from '../src/index.js'
import {
  compress as compressMain,
  decompress as decompressMain,
} from '../src/lzma_main.js'

type CompressMode = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9

// Promisified helpers for callback-based API
const compressCB = (
  data: string | Uint8Array,
  mode: CompressMode,
): Promise<Uint8Array> => {
  return new Promise((resolve, reject) => {
    compressMain(data, mode, (result, error) => {
      if (error) reject(error)
      else if (result) resolve(result as Uint8Array)
      else reject(new Error('Compression returned null'))
    })
  })
}

const decompressCB = (data: Uint8Array): Promise<string | Uint8Array> => {
  return new Promise((resolve, reject) => {
    decompressMain(data, (result, error) => {
      if (error) reject(error)
      else if (result !== null && result !== undefined) resolve(result)
      else reject(new Error('Decompression returned null'))
    })
  })
}

describe('Promise-based API', () => {
  describe('compress', () => {
    test('compresses string with default mode', async () => {
      const input = 'Hello, World!'
      const compressed = await compress(input)

      expect(compressed).toBeInstanceOf(Uint8Array)
      expect(compressed.length).toBeGreaterThan(0)
      // LZMA files start with 0x5d (properties byte)
      expect(compressed[0]).toBe(0x5d)
    })

    test('compresses string with explicit mode', async () => {
      const input = 'Hello, World!'
      const compressed = await compress(input, 5)

      expect(compressed).toBeInstanceOf(Uint8Array)
      expect(compressed.length).toBeGreaterThan(0)
    })

    test('compresses Uint8Array', async () => {
      const input = new Uint8Array([72, 101, 108, 108, 111]) // "Hello"
      const compressed = await compress(input)

      expect(compressed).toBeInstanceOf(Uint8Array)
      expect(compressed.length).toBeGreaterThan(0)
    })

    test('compression with all modes 1-9', async () => {
      const input = 'Test data for compression mode testing'

      for (let mode = 1; mode <= 9; mode++) {
        const compressed = await compress(input, mode as CompressMode)
        expect(compressed).toBeInstanceOf(Uint8Array)
        expect(compressed.length).toBeGreaterThan(0)
      }
    })
  })

  describe('decompress', () => {
    test('decompresses to original string', async () => {
      const input = 'Hello, World!'
      const compressed = await compress(input)
      const decompressed = await decompress(compressed)

      expect(decompressed).toBe(input)
    })

    test('decompresses binary data to Uint8Array', async () => {
      // Use binary data with non-printable bytes
      const input = new Uint8Array([0x00, 0x01, 0x02, 0xff, 0xfe])
      const compressed = await compress(input)
      const decompressed = await decompress(compressed)

      expect(decompressed).toBeInstanceOf(Uint8Array)
      expect(decompressed).toEqual(input)
    })
  })

  describe('round-trip compression/decompression', () => {
    test('preserves single character', async () => {
      const input = 'a'
      const compressed = await compress(input)
      const decompressed = await decompress(compressed)

      expect(decompressed).toBe(input)
    })

    test('preserves unicode characters', async () => {
      const input = '你好世界! 🎉 Ñoño émoji'
      const compressed = await compress(input)
      const decompressed = await decompress(compressed)

      expect(decompressed).toBe(input)
    })

    test('preserves multi-byte unicode', async () => {
      const input = '𝕳𝖊𝖑𝖑𝖔 𝖂𝖔𝖗𝖑𝖉' // Gothic script
      const compressed = await compress(input)
      const decompressed = await decompress(compressed)

      expect(decompressed).toBe(input)
    })

    test('preserves newlines and special characters', async () => {
      const input = 'Line1\nLine2\r\nLine3\tTab'
      const compressed = await compress(input)
      const decompressed = await decompress(compressed)

      expect(decompressed).toBe(input)
    })

    test('preserves repeated pattern (highly compressible)', async () => {
      const input = 'abcdefg'.repeat(1000)
      const compressed = await compress(input)
      const decompressed = await decompress(compressed)

      expect(decompressed).toBe(input)
      // Repeated data should compress well
      expect(compressed.length).toBeLessThan(input.length)
    })

    test('preserves binary data with null bytes', async () => {
      const input = new Uint8Array([0x00, 0x00, 0x00, 0x01, 0x02, 0x00])
      const compressed = await compress(input)
      const decompressed = await decompress(compressed)

      expect(decompressed).toEqual(input)
    })

    test('preserves all byte values 0-255', async () => {
      const input = new Uint8Array(256)
      for (let i = 0; i < 256; i++) {
        input[i] = i
      }
      const compressed = await compress(input)
      const decompressed = await decompress(compressed)

      expect(decompressed).toEqual(input)
    })
  })
})

describe('Callback-based API (lzma_main.ts)', () => {
  describe('compress', () => {
    test('compresses string with callback', async () => {
      const input = 'Hello, World!'
      const compressed = await compressCB(input, 1)

      expect(compressed).toBeInstanceOf(Uint8Array)
      expect(compressed.length).toBeGreaterThan(0)
    })

    test('calls callback asynchronously', () => {
      return new Promise<void>((resolve) => {
        let callbackCalled = false

        compressMain('test', 1, (result) => {
          callbackCalled = true
          expect(result).toBeInstanceOf(Uint8Array)
          resolve()
        })

        // Callback should not be called synchronously
        expect(callbackCalled).toBe(false)
      })
    })
  })

  describe('decompress', () => {
    test('decompresses with callback', async () => {
      const input = 'Hello, World!'
      const compressed = await compressCB(input, 1)
      const decompressed = await decompressCB(compressed)

      expect(decompressed).toBe(input)
    })

    test('calls callback asynchronously', async () => {
      const compressed = await compressCB('test', 1)

      return new Promise<void>((resolve) => {
        let callbackCalled = false

        decompressMain(compressed, (result) => {
          callbackCalled = true
          expect(result).toBe('test')
          resolve()
        })

        // Callback should not be called synchronously
        expect(callbackCalled).toBe(false)
      })
    })
  })

  describe('progress callbacks', () => {
    test('compress calls progress callback', async () => {
      const progressValues: number[] = []
      const input = 'a'.repeat(10000) // Larger input to trigger progress

      await new Promise<void>((resolve, reject) => {
        compressMain(
          input,
          1,
          (result, error) => {
            if (error) reject(error)
            else resolve()
          },
          (progress) => {
            progressValues.push(progress)
          },
        )
      })

      // Should have at least start (0) and end (1) progress
      expect(progressValues.length).toBeGreaterThanOrEqual(2)
      expect(progressValues[0]).toBe(0)
      expect(progressValues[progressValues.length - 1]).toBe(1)
    })

    test('decompress calls progress callback', async () => {
      const progressValues: number[] = []
      const input = 'a'.repeat(10000)
      const compressed = await compressCB(input, 1)

      await new Promise<void>((resolve, reject) => {
        decompressMain(
          compressed,
          (result, error) => {
            if (error) reject(error)
            else resolve()
          },
          (progress) => {
            progressValues.push(progress)
          },
        )
      })

      // Should have at least start (0) and end (1) progress
      expect(progressValues.length).toBeGreaterThanOrEqual(2)
      expect(progressValues[0]).toBe(0)
      expect(progressValues[progressValues.length - 1]).toBe(1)
    })
  })
})

describe('Synchronous API (lzma_main.ts)', () => {
  describe('compress (sync mode)', () => {
    test('returns Uint8Array when called without callbacks', () => {
      const input = 'Hello, World!'
      const result = compressMain(input, 1)

      expect(result).toBeInstanceOf(Uint8Array)
      expect((result as Uint8Array).length).toBeGreaterThan(0)
    })

    test('compresses different modes synchronously', () => {
      const input = 'Test data'

      for (let mode = 1; mode <= 9; mode++) {
        const result = compressMain(input, mode as CompressMode)
        expect(result).toBeInstanceOf(Uint8Array)
      }
    })
  })

  describe('decompress (sync mode)', () => {
    test('returns string when called without callbacks', () => {
      const input = 'Hello, World!'
      const compressed = compressMain(input, 1) as Uint8Array
      const result = decompressMain(compressed)

      expect(result).toBe(input)
    })

    test('returns Uint8Array for binary input', () => {
      const input = new Uint8Array([0x00, 0x01, 0x02, 0xff])
      const compressed = compressMain(input, 1) as Uint8Array
      const result = decompressMain(compressed)

      expect(result).toEqual(input)
    })
  })

  describe('round-trip sync', () => {
    test('preserves string data', () => {
      const input = 'Synchronous test string'
      const compressed = compressMain(input, 1) as Uint8Array
      const decompressed = decompressMain(compressed)

      expect(decompressed).toBe(input)
    })

    test('preserves binary data', () => {
      const input = new Uint8Array([1, 2, 3, 4, 5, 255, 254, 253])
      const compressed = compressMain(input, 1) as Uint8Array
      const decompressed = decompressMain(compressed)

      expect(decompressed).toEqual(input)
    })
  })
})

describe('Compression modes behavior', () => {
  const testData = 'The quick brown fox jumps over the lazy dog. '.repeat(100)

  test('higher modes produce smaller or equal output for compressible data', async () => {
    const sizes: number[] = []

    for (let mode = 1; mode <= 9; mode++) {
      const compressed = await compress(testData, mode as CompressMode)
      sizes.push(compressed.length)
    }

    // Generally higher modes should produce smaller output
    // At minimum, highest mode should be <= lowest mode for compressible data
    expect(sizes[8]).toBeLessThanOrEqual(sizes[0])
  })

  test('all modes produce valid decompressible output', async () => {
    for (let mode = 1; mode <= 9; mode++) {
      const compressed = await compress(testData, mode as CompressMode)
      const decompressed = await decompress(compressed)
      expect(decompressed).toBe(testData)
    }
  })
})

describe('Input type handling', () => {
  describe('string input', () => {
    test('handles ASCII string', async () => {
      const input = 'Hello World'
      const compressed = await compress(input)
      const decompressed = await decompress(compressed)
      expect(decompressed).toBe(input)
    })

    test('handles UTF-8 string', async () => {
      const input = 'Héllo Wörld 你好'
      const compressed = await compress(input)
      const decompressed = await decompress(compressed)
      expect(decompressed).toBe(input)
    })
  })

  describe('Uint8Array input', () => {
    test('handles Uint8Array with binary data', async () => {
      // Binary data (non-printable) should return Uint8Array
      const input = new Uint8Array([0x00, 0x01, 0x02, 0xff, 0xfe])
      const compressed = await compress(input)
      const decompressed = await decompress(compressed)
      expect(decompressed).toEqual(input)
    })

    test('Uint8Array with printable ASCII returns string', async () => {
      // Printable ASCII in Uint8Array decompresses to string
      const input = new Uint8Array([65, 66, 67, 68]) // ABCD
      const compressed = await compress(input)
      const decompressed = await decompress(compressed)
      // Library converts printable ASCII to string
      expect(decompressed).toBe('ABCD')
    })
  })

  describe('Buffer input (Node.js)', () => {
    test('handles Buffer for compression', async () => {
      const input = Buffer.from('Hello World')
      const compressed = await compress(input)
      const decompressed = await decompress(compressed)
      // Buffer text content decompresses to string
      expect(decompressed).toBe('Hello World')
    })

    test('handles Buffer with binary data', async () => {
      const input = Buffer.from([0x00, 0x01, 0xff, 0xfe])
      const compressed = await compress(input)
      const decompressed = await decompress(compressed)
      expect(decompressed).toEqual(new Uint8Array(input))
    })
  })
})

describe('Edge cases', () => {
  test('handles very long repeated string', async () => {
    const input = 'x'.repeat(100000)
    const compressed = await compress(input, 1)
    const decompressed = await decompress(compressed)
    expect(decompressed).toBe(input)
    // Highly repetitive data should compress very well
    expect(compressed.length).toBeLessThan(input.length / 10)
  })

  test('handles string with only whitespace', async () => {
    const input = '   \t\n\r   '
    const compressed = await compress(input)
    const decompressed = await decompress(compressed)
    expect(decompressed).toBe(input)
  })

  test('handles string with null characters', async () => {
    const input = 'hello\x00world\x00test'
    const compressed = await compress(input)
    const decompressed = await decompress(compressed)
    expect(decompressed).toBe(input)
  })

  test('handles very short string', async () => {
    const input = 'ab'
    const compressed = await compress(input)
    const decompressed = await decompress(compressed)
    expect(decompressed).toBe(input)
  })

  test('handles JSON string', async () => {
    const input = JSON.stringify({ key: 'value', number: 42, array: [1, 2, 3] })
    const compressed = await compress(input)
    const decompressed = await decompress(compressed)
    expect(decompressed).toBe(input)
    expect(JSON.parse(decompressed as string)).toEqual(JSON.parse(input))
  })

  test('handles base64 encoded data', async () => {
    const input = Buffer.from('Hello World').toString('base64')
    const compressed = await compress(input)
    const decompressed = await decompress(compressed)
    expect(decompressed).toBe(input)
  })
})

describe('Error handling', () => {
  test('decompress rejects on invalid data', async () => {
    const invalidData = new Uint8Array([1, 2, 3, 4, 5])

    await expect(decompress(invalidData)).rejects.toThrow()
  })

  test('decompress rejects on corrupted header', async () => {
    const input = 'Hello World'
    const compressed = await compress(input)
    // Corrupt the header
    const corrupted = new Uint8Array(compressed)
    corrupted[0] = 0xff

    await expect(decompress(corrupted)).rejects.toThrow()
  })

  test('sync decompress throws on invalid data', () => {
    expect(() => {
      decompressMain(new Uint8Array([1, 2, 3, 4, 5]))
    }).toThrow()
  })

  test('callback API returns error for invalid data', () => {
    return new Promise<void>((resolve) => {
      decompressMain(new Uint8Array([1, 2, 3]), (result, error) => {
        expect(error).toBeDefined()
        expect(result).toBeNull()
        resolve()
      })
    })
  })
})

describe('LZMA format compliance', () => {
  test('compressed output starts with LZMA header byte', async () => {
    const compressed = await compress('test')
    // LZMA files start with 0x5d (properties byte for lc=3, lp=0, pb=2)
    expect(compressed[0]).toBe(0x5d)
  })

  test('compressed output contains dictionary size', async () => {
    const compressed = await compress('test')
    // Bytes 1-4 contain dictionary size (little-endian)
    const dictSize =
      compressed[1] |
      (compressed[2] << 8) |
      (compressed[3] << 16) |
      (compressed[4] << 24)
    expect(dictSize).toBeGreaterThan(0)
  })

  test('compressed output contains uncompressed size', async () => {
    const input = 'Hello'
    const compressed = await compress(input)
    // Bytes 5-12 contain uncompressed size (little-endian, 8 bytes)
    const sizeLow =
      compressed[5] |
      (compressed[6] << 8) |
      (compressed[7] << 16) |
      (compressed[8] << 24)
    // For small inputs, the low bytes should match the input length
    expect(sizeLow).toBe(input.length)
  })
})

describe('Cross-mode compatibility', () => {
  test('data compressed with mode 1 decompresses correctly', async () => {
    const input = 'Test data for cross-mode compatibility'
    const compressed = compressMain(input, 1) as Uint8Array
    const decompressed = decompressMain(compressed)
    expect(decompressed).toBe(input)
  })

  test('data compressed with mode 9 decompresses correctly', async () => {
    const input = 'Test data for cross-mode compatibility'
    const compressed = compressMain(input, 9) as Uint8Array
    const decompressed = decompressMain(compressed)
    expect(decompressed).toBe(input)
  })

  test('sync compressed data can be async decompressed', async () => {
    const input = 'Mixed mode test'
    const compressed = compressMain(input, 5) as Uint8Array
    const decompressed = await decompress(compressed)
    expect(decompressed).toBe(input)
  })

  test('async compressed data can be sync decompressed', async () => {
    const input = 'Mixed mode test'
    const compressed = await compress(input, 5)
    const decompressed = decompressMain(compressed)
    expect(decompressed).toBe(input)
  })
})

describe('Default parameter values', () => {
  test('compress uses mode 9 by default', async () => {
    const input = 'Test with default mode'

    const compressedDefault = await compress(input)
    const compressedMode9 = await compress(input, 9)

    // Same mode should produce identical output
    expect(compressedDefault).toEqual(compressedMode9)
  })
})

describe('Compression determinism', () => {
  test('same input produces same output', async () => {
    const input = 'Deterministic compression test'

    const compressed1 = await compress(input, 5)
    const compressed2 = await compress(input, 5)

    expect(compressed1).toEqual(compressed2)
  })

  test('sync and async produce same output', async () => {
    const input = 'Sync vs async test'

    const syncResult = compressMain(input, 5) as Uint8Array
    const asyncResult = await compress(input, 5)

    expect(syncResult).toEqual(asyncResult)
  })
})

describe('Large data handling', () => {
  test('handles 1MB of text data', async () => {
    const input = 'Lorem ipsum dolor sit amet. '.repeat(40000) // ~1MB
    const compressed = await compress(input, 1)
    const decompressed = await decompress(compressed)

    expect(decompressed).toBe(input)
  }, 30000) // 30 second timeout

  test('handles 1MB of random-ish binary data', async () => {
    const input = new Uint8Array(1024 * 1024)
    for (let i = 0; i < input.length; i++) {
      input[i] = (i * 7 + 13) % 256 // Pseudo-random but deterministic
    }

    const compressed = await compress(input, 1)
    const decompressed = await decompress(compressed)

    expect(decompressed).toEqual(input)
  }, 30000)
})

describe('Unicode handling', () => {
  test('handles CJK characters', async () => {
    const input = '中文测试 日本語テスト 한국어 테스트'
    const compressed = await compress(input)
    const decompressed = await decompress(compressed)
    expect(decompressed).toBe(input)
  })

  test('handles Arabic and Hebrew (RTL)', async () => {
    const input = 'مرحبا بالعالم שלום עולם'
    const compressed = await compress(input)
    const decompressed = await decompress(compressed)
    expect(decompressed).toBe(input)
  })

  test('handles emoji', async () => {
    const input = '😀🎉🚀💻🌍🎨🎵🍕'
    const compressed = await compress(input)
    const decompressed = await decompress(compressed)
    expect(decompressed).toBe(input)
  })

  test('handles combining characters', async () => {
    const input = 'e\u0301' // é as e + combining acute accent
    const compressed = await compress(input)
    const decompressed = await decompress(compressed)
    expect(decompressed).toBe(input)
  })

  test('handles zero-width characters', async () => {
    const input = 'a\u200Bb\u200Cc' // zero-width space and non-joiner
    const compressed = await compress(input)
    const decompressed = await decompress(compressed)
    expect(decompressed).toBe(input)
  })
})
