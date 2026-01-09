/**
 * Browser environment tests for lzma-web
 *
 * These tests run in a simulated browser environment (happy-dom) and test
 * the worker-based API from lzma.ts. Since happy-dom doesn't fully support
 * Web Workers, we mock the Worker to simulate the worker's behavior.
 *
 * @vitest-environment happy-dom
 */

import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest'
import { compress, decompress } from '../src/lzma_main.js'

// Mock Worker class that simulates the actual worker behavior
class MockWorker {
  onmessage: ((e: MessageEvent) => void) | null = null
  onerror: ((e: ErrorEvent) => void) | null = null

  postMessage(data: {
    action: number
    cbn: number
    data: string | Uint8Array | ArrayBuffer
    mode: number | false
  }) {
    // Simulate async worker behavior
    setTimeout(() => {
      try {
        if (data.action === 1) {
          // Compress
          compress(data.data, data.mode as 1, (result, error) => {
            this.onmessage?.({
              data: {
                action: 1,
                cbn: data.cbn,
                result: result,
                error: error,
              },
            } as MessageEvent)
          })
        } else if (data.action === 2) {
          // Decompress
          decompress(data.data as Uint8Array, (result, error) => {
            this.onmessage?.({
              data: {
                action: 2,
                cbn: data.cbn,
                result: result,
                error: error,
              },
            } as MessageEvent)
          })
        }
      } catch (err) {
        this.onerror?.({
          message: (err as Error).message,
          filename: 'worker.js',
          lineno: 1,
        } as ErrorEvent)
      }
    }, 0)
  }

  terminate() {
    // No-op for mock
  }
}

// Store original Worker
const OriginalWorker = globalThis.Worker

describe('Worker-based API (lzma.ts)', () => {
  beforeEach(() => {
    // Mock the Worker globally before importing lzma.ts
    vi.stubGlobal('Worker', MockWorker)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  test('mock worker is set up correctly', () => {
    expect(globalThis.Worker).toBe(MockWorker)
  })

  // Since lzma.ts creates the worker at import time, we need to dynamically import it
  test('LZMA.compress works through worker', async () => {
    // Reset module cache and reimport with mocked Worker
    vi.resetModules()
    const { LZMA } = await import('../src/lzma.js')

    const input = 'Hello, Worker World!'

    const result = await new Promise<Uint8Array>((resolve, reject) => {
      LZMA.compress(input, 1, (result, error) => {
        if (error) reject(error)
        else if (result) resolve(result)
        else reject(new Error('null result'))
      })
    })

    expect(result).toBeInstanceOf(Uint8Array)
    expect(result.length).toBeGreaterThan(0)
    expect(result[0]).toBe(0x5d) // LZMA header
  })

  test('LZMA.decompress works through worker', async () => {
    vi.resetModules()
    const { LZMA } = await import('../src/lzma.js')

    const input = 'Hello, Worker World!'

    // First compress
    const compressed = await new Promise<Uint8Array>((resolve, reject) => {
      LZMA.compress(input, 1, (result, error) => {
        if (error) reject(error)
        else if (result) resolve(result)
        else reject(new Error('null result'))
      })
    })

    // Then decompress
    const decompressed = await new Promise<string | Uint8Array>(
      (resolve, reject) => {
        LZMA.decompress(compressed, (result, error) => {
          if (error) reject(error)
          else if (result) resolve(result)
          else reject(new Error('null result'))
        })
      },
    )

    expect(decompressed).toBe(input)
  })

  test('LZMA.compress with progress callback', async () => {
    vi.resetModules()

    // Create a mock that also sends progress events
    class MockWorkerWithProgress extends MockWorker {
      postMessage(data: {
        action: number
        cbn: number
        data: string | Uint8Array | ArrayBuffer
        mode: number | false
      }) {
        setTimeout(() => {
          // Send progress updates
          this.onmessage?.({
            data: {
              action: 3, // action_progress
              cbn: data.cbn,
              result: 0,
            },
          } as MessageEvent)

          this.onmessage?.({
            data: {
              action: 3,
              cbn: data.cbn,
              result: 0.5,
            },
          } as MessageEvent)

          this.onmessage?.({
            data: {
              action: 3,
              cbn: data.cbn,
              result: 1,
            },
          } as MessageEvent)

          // Then send the actual result
          if (data.action === 1) {
            compress(data.data, data.mode as 1, (result, error) => {
              this.onmessage?.({
                data: {
                  action: 1,
                  cbn: data.cbn,
                  result: result,
                  error: error,
                },
              } as MessageEvent)
            })
          }
        }, 0)
      }
    }

    vi.stubGlobal('Worker', MockWorkerWithProgress)
    const { LZMA } = await import('../src/lzma.js')

    const progressValues: number[] = []
    const input = 'Test with progress'

    await new Promise<void>((resolve, reject) => {
      LZMA.compress(
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

    expect(progressValues).toContain(0)
    expect(progressValues).toContain(0.5)
    expect(progressValues).toContain(1)
  })

  test('LZMA.worker() returns the worker instance', async () => {
    vi.resetModules()
    const { LZMA } = await import('../src/lzma.js')

    const worker = LZMA.worker()
    expect(worker).toBeInstanceOf(MockWorker)
  })

  test('worker error handling', async () => {
    vi.resetModules()

    // Create a mock worker that throws an error
    class ErrorWorker {
      onmessage: ((e: MessageEvent) => void) | null = null
      onerror: ((e: ErrorEvent) => void) | null = null

      postMessage() {
        setTimeout(() => {
          this.onerror?.({
            message: 'Worker error',
            filename: 'worker.js',
            lineno: 1,
          } as ErrorEvent)
        }, 0)
      }

      terminate() {}
    }

    vi.stubGlobal('Worker', ErrorWorker)
    const { LZMA } = await import('../src/lzma.js')

    await expect(
      new Promise<void>((resolve, reject) => {
        LZMA.compress('test', 1, (result, error) => {
          if (error) reject(error)
          else resolve()
        })
      }),
    ).rejects.toThrow('Worker error')
  })

  test('handles multiple concurrent operations', async () => {
    vi.resetModules()
    vi.stubGlobal('Worker', MockWorker)
    const { LZMA } = await import('../src/lzma.js')

    const inputs = ['First', 'Second', 'Third']
    const promises = inputs.map(
      (input) =>
        new Promise<{ input: string; result: string | Uint8Array }>(
          (resolve, reject) => {
            LZMA.compress(input, 1, (compressed, error) => {
              if (error) return reject(error)
              LZMA.decompress(compressed!, (result, error) => {
                if (error) reject(error)
                else resolve({ input, result: result! })
              })
            })
          },
        ),
    )

    const results = await Promise.all(promises)

    results.forEach(({ input, result }) => {
      expect(result).toBe(input)
    })
  })
})

describe('Worker message handling edge cases', () => {
  beforeEach(() => {
    vi.stubGlobal('Worker', MockWorker)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  test('ignores messages for unknown callback numbers', async () => {
    vi.resetModules()

    class MockWorkerWithExtraMessages extends MockWorker {
      postMessage(data: {
        action: number
        cbn: number
        data: string | Uint8Array | ArrayBuffer
        mode: number | false
      }) {
        setTimeout(() => {
          // Send a message with unknown cbn first
          this.onmessage?.({
            data: {
              action: 1,
              cbn: 99999999, // Unknown callback number
              result: new Uint8Array([1, 2, 3]),
            },
          } as MessageEvent)

          // Then send the real result
          if (data.action === 1) {
            compress(data.data, data.mode as 1, (result, error) => {
              this.onmessage?.({
                data: {
                  action: 1,
                  cbn: data.cbn,
                  result: result,
                  error: error,
                },
              } as MessageEvent)
            })
          }
        }, 0)
      }
    }

    vi.stubGlobal('Worker', MockWorkerWithExtraMessages)
    const { LZMA } = await import('../src/lzma.js')

    // Should still work despite the extra message
    const result = await new Promise<Uint8Array>((resolve, reject) => {
      LZMA.compress('test', 1, (result, error) => {
        if (error) reject(error)
        else if (result) resolve(result)
        else reject(new Error('null result'))
      })
    })

    expect(result).toBeInstanceOf(Uint8Array)
  })

  test('progress callback is optional', async () => {
    vi.resetModules()

    class MockWorkerWithProgress extends MockWorker {
      postMessage(data: {
        action: number
        cbn: number
        data: string | Uint8Array | ArrayBuffer
        mode: number | false
      }) {
        setTimeout(() => {
          // Send progress even though no callback is registered
          this.onmessage?.({
            data: {
              action: 3,
              cbn: data.cbn,
              result: 0.5,
            },
          } as MessageEvent)

          if (data.action === 1) {
            compress(data.data, data.mode as 1, (result, error) => {
              this.onmessage?.({
                data: {
                  action: 1,
                  cbn: data.cbn,
                  result: result,
                  error: error,
                },
              } as MessageEvent)
            })
          }
        }, 0)
      }
    }

    vi.stubGlobal('Worker', MockWorkerWithProgress)
    const { LZMA } = await import('../src/lzma.js')

    // Call without progress callback - should not throw
    const result = await new Promise<Uint8Array>((resolve, reject) => {
      LZMA.compress('test', 1, (result, error) => {
        if (error) reject(error)
        else if (result) resolve(result)
        else reject(new Error('null result'))
      })
      // No progress callback passed
    })

    expect(result).toBeInstanceOf(Uint8Array)
  })

  test('callbacks are cleaned up after completion', async () => {
    vi.resetModules()
    vi.stubGlobal('Worker', MockWorker)
    const { LZMA } = await import('../src/lzma.js')

    // Run a compression
    await new Promise<void>((resolve, reject) => {
      LZMA.compress('test', 1, (result, error) => {
        if (error) reject(error)
        else resolve()
      })
    })

    // The callback should be cleaned up - hard to verify directly
    // but running multiple operations should work without memory issues
    for (let i = 0; i < 10; i++) {
      await new Promise<void>((resolve, reject) => {
        LZMA.compress(`test ${i}`, 1, (result, error) => {
          if (error) reject(error)
          else resolve()
        })
      })
    }
  })
})

describe('Worker.ts message handler', () => {
  test('worker handles compress action', async () => {
    // Test the worker.ts message handler directly
    const messageHandler = vi.fn()

    // Simulate what the worker does
    const action_compress = 1
    const testData = {
      action: action_compress,
      data: 'test',
      mode: 1,
      cbn: 12345,
    }

    // The worker calls compress with a callback number
    const result = await new Promise<Uint8Array>((resolve, reject) => {
      compress(testData.data, testData.mode as 1, (result, error) => {
        if (error) reject(error)
        else resolve(result as Uint8Array)
      })
    })

    expect(result).toBeInstanceOf(Uint8Array)
  })

  test('worker handles decompress action', async () => {
    const action_decompress = 2

    // First compress some data
    const compressed = await new Promise<Uint8Array>((resolve, reject) => {
      compress('test data', 1, (result, error) => {
        if (error) reject(error)
        else resolve(result as Uint8Array)
      })
    })

    const testData = {
      action: action_decompress,
      data: compressed,
      cbn: 12345,
    }

    // Decompress
    const result = await new Promise<string | Uint8Array>((resolve, reject) => {
      decompress(testData.data, (result, error) => {
        if (error) reject(error)
        else resolve(result!)
      })
    })

    expect(result).toBe('test data')
  })
})

describe('Worker.ts module direct testing', () => {
  let capturedHandler: ((e: MessageEvent) => void) | null = null
  let originalAddEventListener: typeof addEventListener

  beforeEach(() => {
    // Capture the message handler when worker.ts is imported
    originalAddEventListener = globalThis.addEventListener
    vi.stubGlobal(
      'addEventListener',
      (type: string, handler: (e: MessageEvent) => void) => {
        if (type === 'message') {
          capturedHandler = handler
        }
      },
    )
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    capturedHandler = null
  })

  test('worker.ts registers message handler', async () => {
    vi.resetModules()
    await import('../src/worker.js')

    expect(capturedHandler).not.toBeNull()
    expect(typeof capturedHandler).toBe('function')
  })

  test('worker.ts handles compress action via message', async () => {
    vi.resetModules()

    // Mock postMessage to capture the result
    const postedMessages: any[] = []
    vi.stubGlobal('postMessage', (msg: any) => {
      postedMessages.push(msg)
    })

    await import('../src/worker.js')

    expect(capturedHandler).not.toBeNull()

    // Simulate a compress message
    const testCbn = 12345
    capturedHandler!({
      data: {
        action: 1, // action_compress
        data: 'Hello Worker',
        mode: 1,
        cbn: testCbn,
      },
    } as MessageEvent)

    // Wait for async compression to complete
    await new Promise((resolve) => setTimeout(resolve, 100))

    // Check that postMessage was called with the result
    const resultMessage = postedMessages.find(
      (m) => m.action === 1 && m.cbn === testCbn,
    )
    expect(resultMessage).toBeDefined()
    expect(resultMessage.result).toBeInstanceOf(Uint8Array)
  })

  test('worker.ts handles decompress action via message', async () => {
    vi.resetModules()

    // First compress some data
    const compressed = await new Promise<Uint8Array>((resolve, reject) => {
      compress('Hello Worker', 1, (result, error) => {
        if (error) reject(error)
        else resolve(result as Uint8Array)
      })
    })

    // Mock postMessage
    const postedMessages: any[] = []
    vi.stubGlobal('postMessage', (msg: any) => {
      postedMessages.push(msg)
    })

    await import('../src/worker.js')

    expect(capturedHandler).not.toBeNull()

    // Simulate a decompress message
    const testCbn = 54321
    capturedHandler!({
      data: {
        action: 2, // action_decompress
        data: compressed,
        cbn: testCbn,
      },
    } as MessageEvent)

    // Wait for async decompression to complete
    await new Promise((resolve) => setTimeout(resolve, 100))

    // Check that postMessage was called with the result
    const resultMessage = postedMessages.find(
      (m) => m.action === 2 && m.cbn === testCbn,
    )
    expect(resultMessage).toBeDefined()
    expect(resultMessage.result).toBe('Hello Worker')
  })

  test('worker.ts ignores invalid action', async () => {
    vi.resetModules()

    const postedMessages: any[] = []
    vi.stubGlobal('postMessage', (msg: any) => {
      postedMessages.push(msg)
    })

    await import('../src/worker.js')

    // Simulate an invalid action
    capturedHandler!({
      data: {
        action: 999, // Invalid action
        data: 'test',
        cbn: 11111,
      },
    } as MessageEvent)

    await new Promise((resolve) => setTimeout(resolve, 50))

    // No message should be posted for invalid action
    expect(postedMessages.length).toBe(0)
  })

  test('worker.ts handles null/undefined message data', async () => {
    vi.resetModules()

    const postedMessages: any[] = []
    vi.stubGlobal('postMessage', (msg: any) => {
      postedMessages.push(msg)
    })

    await import('../src/worker.js')

    // These should not throw
    capturedHandler!({ data: null } as MessageEvent)
    capturedHandler!({ data: undefined } as MessageEvent)
    capturedHandler!({} as MessageEvent)

    await new Promise((resolve) => setTimeout(resolve, 50))

    // No messages should be posted
    expect(postedMessages.length).toBe(0)
  })
})
