import {
  describe,
  test,
  expect,
  beforeEach,
  afterEach,
  vi,
} from 'vitest'
import { createWorkerLZMA } from '../src/worker-api.js'
import type { WorkerLZMA } from '../src/types.js'

// Check if Workers are available in this environment
const hasWorker = typeof Worker !== 'undefined'

describe('Worker API', () => {
  describe('createWorkerLZMA factory', () => {
    test('returns WorkerLZMA object with correct shape', () => {
      const lzma = createWorkerLZMA()
      expect(typeof lzma.compress).toBe('function')
      expect(typeof lzma.decompress).toBe('function')
      expect(typeof lzma.terminate).toBe('function')
      expect(lzma.worker).toBeNull() // Lazy initialization
    })

    test('worker is null before first operation', () => {
      const lzma = createWorkerLZMA()
      expect(lzma.worker).toBeNull()
    })

    test('does not create a worker or emit errors on instantiation', () => {
      class SilentWorkerMock {
        static instances: SilentWorkerMock[] = []
        onmessage: Worker['onmessage'] = null
        onerror: Worker['onerror'] = null

        constructor(_url: URL | string, _options?: unknown) {
          SilentWorkerMock.instances.push(this)
        }

        postMessage(_message: unknown): void {}

        addEventListener(): void {}

        removeEventListener(): void {}

        terminate(): void {}
      }

      vi.stubGlobal('Worker', SilentWorkerMock as unknown as typeof Worker)
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      const lzma = createWorkerLZMA()

      expect(lzma.worker).toBeNull()
      expect(SilentWorkerMock.instances).toHaveLength(0)
      expect(errorSpy).not.toHaveBeenCalled()
    })

    test('rejects startup failures through the API', async () => {
      class FailingWorkerMock {
        onmessage: Worker['onmessage'] = null
        onerror: Worker['onerror'] = null

        constructor(_url: URL | string, _options?: unknown) {}

        postMessage(_message: unknown): void {
          queueMicrotask(() => {
            this.onerror?.({
              message: 'mock worker bootstrap failure',
              filename: 'mock-worker.js',
              lineno: 1,
            } as ErrorEvent)
          })
        }

        addEventListener(): void {}

        removeEventListener(): void {}

        terminate(): void {}
      }

      vi.stubGlobal('Worker', FailingWorkerMock as unknown as typeof Worker)
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      const lzma = createWorkerLZMA()

      await expect(lzma.compress('test', 1)).rejects.toThrow(
        /Worker error: mock worker bootstrap failure/,
      )
      expect(errorSpy).toHaveBeenCalledWith(
        'Uncaught error in LZMA worker',
        expect.objectContaining({
          message:
            'Worker error: mock worker bootstrap failure (mock-worker.js:1)',
        }),
      )
    })
  })

  describe.skipIf(!hasWorker)('with real Workers', () => {
    let lzma: WorkerLZMA

    beforeEach(() => {
      lzma = createWorkerLZMA()
    })

    afterEach(() => {
      lzma?.terminate()
    })

    test('compress creates Uint8Array', async () => {
      const result = await lzma.compress('Hello, World!', 1)
      expect(result).toBeInstanceOf(Uint8Array)
    })

    test('compresses ArrayBuffer input', async () => {
      const buffer = new ArrayBuffer(10)
      const view = new Uint8Array(buffer)
      view.set([0, 1, 2, 3, 4, 5, 6, 7, 8, 9])
      const result = await lzma.compress(buffer, 1)
      expect(result).toBeInstanceOf(Uint8Array)
    })

    test('worker is created after first operation', async () => {
      expect(lzma.worker).toBeNull()
      await lzma.compress('test', 1)
      expect(lzma.worker).not.toBeNull()
    })

    test('compress/decompress roundtrip', async () => {
      const input = 'Hello Worker!'
      const compressed = await lzma.compress(input, 1)
      const decompressed = await lzma.decompress(compressed)
      expect(decompressed).toBe(input)
    })

    test('terminate cleans up worker', async () => {
      await lzma.compress('test', 1)
      expect(lzma.worker).not.toBeNull()
      lzma.terminate()
      expect(lzma.worker).toBeNull()
    })

    test('can create new worker after terminate', async () => {
      await lzma.compress('test1', 1)
      lzma.terminate()
      expect(lzma.worker).toBeNull()

      // Should be able to compress again (creates new worker)
      const result = await lzma.compress('test2', 1)
      expect(result).toBeInstanceOf(Uint8Array)
    })

    test('supports progress callback', async () => {
      const progressValues: number[] = []
      const input = 'A'.repeat(10000)
      await lzma.compress(input, 1, (p) => progressValues.push(p))
      expect(progressValues.length).toBeGreaterThan(0)
    })

    test('multiple concurrent operations', async () => {
      const promises = [
        lzma.compress('data1', 1),
        lzma.compress('data2', 1),
        lzma.compress('data3', 1),
      ]
      const results = await Promise.all(promises)
      expect(results).toHaveLength(3)
      results.forEach((r) => expect(r).toBeInstanceOf(Uint8Array))
    })

    test('unicode text roundtrip', async () => {
      const input = '你好世界！Hello World! Привет мир! 🌍🌎🌏'
      const compressed = await lzma.compress(input, 1)
      const decompressed = await lzma.decompress(compressed)
      expect(decompressed).toBe(input)
    })

    test('empty string roundtrip', async () => {
      const input = ''
      const compressed = await lzma.compress(input, 1)
      const decompressed = await lzma.decompress(compressed)
      expect(decompressed).toBe(input)
    })

    test('large data roundtrip', async () => {
      const input = 'A'.repeat(50000)
      const compressed = await lzma.compress(input, 1)
      const decompressed = await lzma.decompress(compressed)
      expect(decompressed).toBe(input)
    })

    test('binary data roundtrip', async () => {
      const input = new Uint8Array([
        0xff, 0xfe, 0x00, 0x80, 0xc0, 0x81, 0x90, 0xa0, 0xb0, 0xc0,
      ])
      const compressed = await lzma.compress(input, 1)
      const decompressed = await lzma.decompress(compressed)
      expect(decompressed).toBeInstanceOf(Uint8Array)
    })

    test('all compression modes', async () => {
      const input = 'Test data for worker modes'
      for (const mode of [1, 5, 9] as const) {
        const compressed = await lzma.compress(input, mode)
        const decompressed = await lzma.decompress(compressed)
        expect(decompressed).toBe(input)
      }
    })

    test('decompression progress callback', async () => {
      const input = 'A'.repeat(10000)
      const compressed = await lzma.compress(input, 1)
      const progressValues: number[] = []
      await lzma.decompress(compressed, (p) => progressValues.push(p))
      expect(progressValues.length).toBeGreaterThan(0)
    })

    test('decompresses from ArrayBuffer input', async () => {
      const input = 'Hello Worker ArrayBuffer!'
      const compressed = await lzma.compress(input, 1)
      const buffer = compressed.buffer.slice(
        compressed.byteOffset,
        compressed.byteOffset + compressed.byteLength,
      ) as ArrayBuffer
      const decompressed = await lzma.decompress(buffer)
      expect(decompressed).toBe(input)
    })

    test('multiple instances work independently', async () => {
      const lzma2 = createWorkerLZMA()
      try {
        const input1 = 'Data for instance 1'
        const input2 = 'Data for instance 2'

        const [result1, result2] = await Promise.all([
          lzma.compress(input1, 1),
          lzma2.compress(input2, 1),
        ])

        expect(result1).toBeInstanceOf(Uint8Array)
        expect(result2).toBeInstanceOf(Uint8Array)

        const [dec1, dec2] = await Promise.all([
          lzma.decompress(result1),
          lzma2.decompress(result2),
        ])

        expect(dec1).toBe(input1)
        expect(dec2).toBe(input2)
      } finally {
        lzma2.terminate()
      }
    })

    test('default compression mode', async () => {
      const input = 'Test default mode'
      const compressed = await lzma.compress(input)
      const decompressed = await lzma.decompress(compressed)
      expect(decompressed).toBe(input)
    })
  })

  describe('without Workers (Node.js environment)', () => {
    test.skipIf(hasWorker)(
      'throws helpful error when Worker unavailable',
      async () => {
        const lzma = createWorkerLZMA()
        await expect(lzma.compress('test', 1)).rejects.toThrow(
          /Web Workers are not available/,
        )
      },
    )
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })
})
