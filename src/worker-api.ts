/**
 * Web Worker-based LZMA compression/decompression API
 *
 * This module provides a Worker-based API that offloads compression
 * to a separate thread, keeping the main thread responsive.
 *
 * The Worker is lazily initialized on first use.
 */

import { workerThreadSource } from './generated/worker-inline.js'
import type { CompressMode, OnProgressCallback, WorkerLZMA } from './types.js'

const ACTION_COMPRESS = 1
const ACTION_DECOMPRESS = 2
const ACTION_PROGRESS = 3

interface WorkerMessage {
  action: number
  cbn: number
  result?: Uint8Array | string | number // number is used for progress updates
  error?: Error
}

interface PendingCallback {
  resolve: (result: Uint8Array | string) => void
  reject: (error: Error) => void
  onProgress?: OnProgressCallback
}

/**
 * Create a Worker-based LZMA instance with lazy initialization
 *
 * The Worker is only created when the first compression/decompression
 * operation is performed. This allows the module to be imported in
 * environments without Workers without throwing errors.
 *
 * @returns WorkerLZMA instance with compress, decompress, and terminate methods
 * @throws Error if Workers are not available when attempting an operation
 *
 * @example
 * ```ts
 * import { createWorkerLZMA } from 'lzma-web/worker'
 *
 * const lzma = createWorkerLZMA()
 * const compressed = await lzma.compress('Hello, World!', 9)
 * const decompressed = await lzma.decompress(compressed)
 *
 * // Clean up when done
 * lzma.terminate()
 * ```
 */
export function createWorkerLZMA(): WorkerLZMA {
  let worker: Worker | null = null
  let workerUrl: string | null = null
  let callbackId = 0
  const pendingCallbacks: Map<number, PendingCallback> = new Map()

  function rejectPendingCallbacks(error: Error): void {
    for (const pending of pendingCallbacks.values()) {
      pending.reject(error)
    }
    pendingCallbacks.clear()
  }

  function disposeWorker(): void {
    const activeWorker = worker
    worker = null

    activeWorker?.terminate()

    if (workerUrl) {
      URL.revokeObjectURL(workerUrl)
      workerUrl = null
    }
  }

  function getWorker(): Worker {
    if (worker) return worker

    // Check if Workers are available
    if (typeof Worker === 'undefined') {
      throw new Error(
        'Web Workers are not available in this environment. ' +
          "Use 'lzma-web' for async operations or 'lzma-web/sync' for synchronous operations instead.",
      )
    }

    const nextWorkerUrl = URL.createObjectURL(
      new Blob([workerThreadSource], { type: 'text/javascript' }),
    )

    let nextWorker: Worker
    try {
      nextWorker = new Worker(nextWorkerUrl, { type: 'module' })
    } catch (error) {
      URL.revokeObjectURL(nextWorkerUrl)
      throw error
    }

    workerUrl = nextWorkerUrl
    worker = nextWorker

    nextWorker.onmessage = (e: MessageEvent<WorkerMessage>) => {
      const { action, cbn, result, error } = e.data
      const pending = pendingCallbacks.get(cbn)

      if (!pending) return

      if (action === ACTION_PROGRESS) {
        // Progress update
        if (pending.onProgress && typeof result === 'number') {
          pending.onProgress(result)
        }
      } else {
        // Completion (compress or decompress)
        pendingCallbacks.delete(cbn)

        if (error) {
          pending.reject(
            error instanceof Error ? error : new Error(String(error)),
          )
        } else if (
          result !== undefined &&
          result !== null &&
          typeof result !== 'number'
        ) {
          pending.resolve(result)
        } else {
          pending.reject(new Error('Operation failed: no result returned'))
        }
      }
    }

    nextWorker.onerror = (event: ErrorEvent) => {
      // A stale event from a worker that has already been replaced must not
      // affect the current worker instance.
      if (worker !== nextWorker) return

      const err = new Error(
        `Worker error: ${event.message} (${event.filename}:${event.lineno})`,
      )

      // A worker error is terminal for that instance. Reject every operation,
      // dispose it, and allow the next request to create a fresh worker.
      rejectPendingCallbacks(err)
      disposeWorker()

      console.error('Uncaught error in LZMA worker', err)
    }

    return nextWorker
  }

  return {
    async compress(
      input: string | Uint8Array | ArrayBuffer,
      mode: CompressMode = 9,
      onProgress?: OnProgressCallback,
    ): Promise<Uint8Array> {
      return new Promise((resolve, reject) => {
        const cbn = callbackId++
        pendingCallbacks.set(cbn, {
          resolve: resolve as (result: Uint8Array | string) => void,
          reject,
          onProgress,
        })

        try {
          getWorker().postMessage({
            action: ACTION_COMPRESS,
            cbn,
            data: input,
            mode,
          })
        } catch (err) {
          pendingCallbacks.delete(cbn)
          reject(err instanceof Error ? err : new Error(String(err)))
        }
      })
    },

    async decompress(
      input: Uint8Array | ArrayBuffer,
      onProgress?: OnProgressCallback,
    ): Promise<string | Uint8Array> {
      return new Promise((resolve, reject) => {
        const cbn = callbackId++
        pendingCallbacks.set(cbn, {
          resolve,
          reject,
          onProgress,
        })

        try {
          getWorker().postMessage({
            action: ACTION_DECOMPRESS,
            cbn,
            data: input,
            mode: false,
          })
        } catch (err) {
          pendingCallbacks.delete(cbn)
          reject(err instanceof Error ? err : new Error(String(err)))
        }
      })
    },

    terminate(): void {
      rejectPendingCallbacks(new Error('Worker terminated'))
      disposeWorker()
    },

    get worker(): Worker | null {
      return worker
    },
  }
}

// Re-export types for convenience
export type { CompressMode, OnProgressCallback, WorkerLZMA } from './types.js'
