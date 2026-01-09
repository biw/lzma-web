/**
 * Web Worker-based LZMA compression/decompression API
 *
 * This module provides a Worker-based API that offloads compression
 * to a separate thread, keeping the main thread responsive.
 *
 * The Worker is lazily initialized on first use.
 */

import type { CompressMode, OnProgressCallback, WorkerLZMA } from './types.js'

const ACTION_COMPRESS = 1
const ACTION_DECOMPRESS = 2
const ACTION_PROGRESS = 3

interface WorkerMessage {
  action: number
  cbn: number
  result?: Uint8Array | string
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
  let callbackId = 0
  const pendingCallbacks: Map<number, PendingCallback> = new Map()

  function getWorker(): Worker {
    if (worker) return worker

    // Check if Workers are available
    if (typeof Worker === 'undefined') {
      throw new Error(
        'Web Workers are not available in this environment. ' +
          "Use 'lzma-web' for async operations or 'lzma-web/sync' for synchronous operations instead.",
      )
    }

    // Lazy initialization - only create Worker when first needed
    // Use .ts extension in development (Vite handles it), .js in production
    const workerFile =
      import.meta.url.endsWith('.ts') || import.meta.url.includes('/@fs/')
        ? './worker.ts'
        : './worker.js'
    const url = new URL(workerFile, import.meta.url)
    worker = new Worker(url, { type: 'module' })

    worker.onmessage = (e: MessageEvent<WorkerMessage>) => {
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
        } else if (result !== undefined && result !== null) {
          pending.resolve(result)
        } else {
          pending.reject(new Error('Operation failed: no result returned'))
        }
      }
    }

    worker.onerror = (event: ErrorEvent) => {
      const err = new Error(
        `Worker error: ${event.message} (${event.filename}:${event.lineno})`,
      )

      // Reject all pending operations
      for (const [cbn, pending] of pendingCallbacks) {
        pending.reject(err)
        pendingCallbacks.delete(cbn)
      }

      console.error('Uncaught error in LZMA worker', err)
    }

    return worker
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

        getWorker().postMessage({
          action: ACTION_COMPRESS,
          cbn,
          data: input,
          mode,
        })
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

        getWorker().postMessage({
          action: ACTION_DECOMPRESS,
          cbn,
          data: input,
          mode: false,
        })
      })
    },

    terminate(): void {
      if (worker) {
        // Reject any pending operations
        for (const [cbn, pending] of pendingCallbacks) {
          pending.reject(new Error('Worker terminated'))
          pendingCallbacks.delete(cbn)
        }

        worker.terminate()
        worker = null
      }
    },

    get worker(): Worker | null {
      return worker
    },
  }
}

// Re-export types for convenience
export type { CompressMode, OnProgressCallback, WorkerLZMA } from './types.js'
