import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest'
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

    test('recreates the Worker after an uncaught Worker error', async () => {
      class RecoveringWorkerMock {
        static instances: RecoveringWorkerMock[] = []
        onmessage: Worker['onmessage'] = null
        onerror: Worker['onerror'] = null
        terminated = false

        constructor(_url: URL | string, _options?: unknown) {
          RecoveringWorkerMock.instances.push(this)
        }

        postMessage(message: { action: number; cbn: number }): void {
          if (RecoveringWorkerMock.instances[0] === this) {
            queueMicrotask(() => {
              this.onerror?.({
                message: 'mock worker crash',
                filename: 'mock-worker.js',
                lineno: 1,
              } as ErrorEvent)
            })
            return
          }

          queueMicrotask(() => {
            const handler = this.onmessage as
              | ((event: MessageEvent) => void)
              | null
            handler?.({
              data: {
                action: message.action,
                cbn: message.cbn,
                result: new Uint8Array([1]),
              },
            } as MessageEvent)
          })
        }

        addEventListener(): void {}

        removeEventListener(): void {}

        terminate(): void {
          this.terminated = true
        }
      }

      vi.stubGlobal('Worker', RecoveringWorkerMock as unknown as typeof Worker)
      vi.spyOn(console, 'error').mockImplementation(() => {})
      const lzma = createWorkerLZMA()

      await expect(lzma.compress('first request', 1)).rejects.toThrow(
        /Worker error: mock worker crash/,
      )
      expect(lzma.worker).toBeNull()
      expect(RecoveringWorkerMock.instances[0].terminated).toBe(true)

      await expect(lzma.compress('recovered request', 1)).resolves.toEqual(
        new Uint8Array([1]),
      )
      expect(RecoveringWorkerMock.instances).toHaveLength(2)
      expect(lzma.worker).toBe(
        RecoveringWorkerMock.instances[1] as unknown as Worker,
      )
    })

    test('cleans up the Blob URL when Worker construction fails', async () => {
      class ConstructionFailingWorkerMock {
        constructor(_url: URL | string, _options?: unknown) {
          throw new Error('mock Worker construction failure')
        }
      }

      vi.stubGlobal(
        'Worker',
        ConstructionFailingWorkerMock as unknown as typeof Worker,
      )
      const revokeObjectURL = vi.spyOn(URL, 'revokeObjectURL')
      const lzma = createWorkerLZMA()

      await expect(lzma.compress('test', 1)).rejects.toThrow(
        'mock Worker construction failure',
      )
      expect(lzma.worker).toBeNull()
      expect(revokeObjectURL).toHaveBeenCalledTimes(1)
    })

    test('ignores errors emitted by an already-replaced Worker', async () => {
      class WorkerMock {
        static instances: WorkerMock[] = []
        onmessage: Worker['onmessage'] = null
        onerror: Worker['onerror'] = null

        constructor(_url: URL | string, _options?: unknown) {
          WorkerMock.instances.push(this)
        }

        postMessage(_message: unknown): void {}

        addEventListener(): void {}

        removeEventListener(): void {}

        terminate(): void {}
      }

      vi.stubGlobal('Worker', WorkerMock as unknown as typeof Worker)
      const lzma = createWorkerLZMA()
      const firstOperation = lzma.compress('first request', 1)
      const firstWorker = WorkerMock.instances[0]

      lzma.terminate()
      await expect(firstOperation).rejects.toThrow('Worker terminated')

      const secondOperation = lzma.compress('second request', 1)
      const secondWorker = WorkerMock.instances[1]
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      firstWorker.onerror?.({
        message: 'stale worker crash',
        filename: 'mock-worker.js',
        lineno: 1,
      } as ErrorEvent)

      expect(lzma.worker).toBe(secondWorker as unknown as Worker)
      expect(errorSpy).not.toHaveBeenCalled()

      lzma.terminate()
      await expect(secondOperation).rejects.toThrow('Worker terminated')
    })

    test('ignores a message with no pending operation', async () => {
      class WorkerMock {
        static instance: WorkerMock
        onmessage: Worker['onmessage'] = null
        onerror: Worker['onerror'] = null

        constructor(_url: URL | string, _options?: unknown) {
          WorkerMock.instance = this
        }

        postMessage(message: { action: number; cbn: number }): void {
          const handler = this.onmessage as
            | ((event: MessageEvent) => void)
            | null
          handler?.({
            data: {
              action: message.action,
              cbn: message.cbn,
              result: new Uint8Array([1]),
            },
          } as MessageEvent)
        }

        addEventListener(): void {}

        removeEventListener(): void {}

        terminate(): void {}
      }

      vi.stubGlobal('Worker', WorkerMock as unknown as typeof Worker)
      const lzma = createWorkerLZMA()
      await lzma.compress('test', 1)

      expect(() => {
        const handler = WorkerMock.instance.onmessage as
          | ((event: MessageEvent) => void)
          | null
        handler?.({
          data: { action: 1, cbn: 0, result: new Uint8Array([1]) },
        } as MessageEvent)
      }).not.toThrow()
    })

    test('rejects worker errors and invalid completion messages', async () => {
      class WorkerMock {
        onmessage: Worker['onmessage'] = null
        onerror: Worker['onerror'] = null

        constructor(_url: URL | string, _options?: unknown) {}

        postMessage(message: { action: number; cbn: number }): void {
          const handler = this.onmessage as
            | ((event: MessageEvent) => void)
            | null
          handler?.({
            data:
              message.action === 1
                ? { action: 1, cbn: message.cbn, error: 'worker failed' }
                : { action: 2, cbn: message.cbn, result: 0 },
          } as MessageEvent)
        }

        addEventListener(): void {}

        removeEventListener(): void {}

        terminate(): void {}
      }

      vi.stubGlobal('Worker', WorkerMock as unknown as typeof Worker)
      const lzma = createWorkerLZMA()

      await expect(lzma.compress('test', 1)).rejects.toThrow('worker failed')
      await expect(lzma.decompress(new Uint8Array([1]))).rejects.toThrow(
        'Operation failed: no result returned',
      )
    })

    test('normalizes postMessage failures', async () => {
      class ThrowingWorkerMock {
        onmessage: Worker['onmessage'] = null
        onerror: Worker['onerror'] = null

        constructor(_url: URL | string, _options?: unknown) {}

        postMessage(message: { action: number }): void {
          if (message.action === 1) throw 'compression post failed'
          throw new Error('decompression post failed')
        }

        addEventListener(): void {}

        removeEventListener(): void {}

        terminate(): void {}
      }

      vi.stubGlobal('Worker', ThrowingWorkerMock as unknown as typeof Worker)
      const lzma = createWorkerLZMA()

      await expect(lzma.compress('test', 1)).rejects.toThrow(
        'compression post failed',
      )
      await expect(lzma.decompress(new Uint8Array([1]))).rejects.toThrow(
        'decompression post failed',
      )
    })

    test('rejects pending work when terminated', async () => {
      class PendingWorkerMock {
        onmessage: Worker['onmessage'] = null
        onerror: Worker['onerror'] = null

        constructor(_url: URL | string, _options?: unknown) {}

        postMessage(_message: unknown): void {}

        addEventListener(): void {}

        removeEventListener(): void {}

        terminate(): void {}
      }

      vi.stubGlobal('Worker', PendingWorkerMock as unknown as typeof Worker)
      const lzma = createWorkerLZMA()
      const operation = lzma.compress('test', 1)
      lzma.terminate()

      await expect(operation).rejects.toThrow('Worker terminated')
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
