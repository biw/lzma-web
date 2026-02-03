/**
 * LZMA compression/decompression library for JavaScript
 *
 * Main entry point with Promise-based async API.
 * For synchronous operations, use 'lzma-web/sync'.
 * For Web Worker-based operations, use 'lzma-web/worker'.
 */

import {
  compress as compressCore,
  decompress as decompressCore,
} from './lzma_main.js'
import type { CompressMode, OnProgressCallback } from './types.js'

// Re-export types for convenience
export type { CompressMode, OnProgressCallback } from './types.js'

/**
 * Callback-based LZMA functions (for advanced use cases)
 */
export const LZMA = {
  compress: compressCore,
  decompress: decompressCore,
}

/**
 * Compress data using LZMA algorithm
 *
 * @param input - Data to compress (string, Uint8Array, or ArrayBuffer)
 * @param mode - Compression level from 1 (fastest) to 9 (best compression). Default is 9.
 * @param onProgress - Optional callback for progress updates (0-1)
 * @returns Promise resolving to compressed data as Uint8Array
 *
 * @example
 * ```ts
 * import { compress } from 'lzma-web'
 * const compressed = await compress('Hello, World!', 9)
 * ```
 */
export async function compress(
  input: string | Uint8Array | ArrayBuffer,
  mode: CompressMode = 9,
  onProgress?: OnProgressCallback,
): Promise<Uint8Array> {
  return new Promise<Uint8Array>((resolve, reject) => {
    compressCore(
      input,
      mode,
      (result, error) => {
        if (error) return reject(error)
        if (result && result instanceof Uint8Array) return resolve(result)
        reject(new Error('Compression failed: unexpected result type'))
      },
      onProgress,
    )
  })
}

/**
 * Decompress LZMA-compressed data
 *
 * @param input - Compressed data (Uint8Array or ArrayBuffer)
 * @param onProgress - Optional callback for progress updates (0-1, or -1 if unknown)
 * @returns Promise resolving to decompressed data as string (if valid UTF-8) or Uint8Array (if binary)
 *
 * @example
 * ```ts
 * import { decompress } from 'lzma-web'
 * const decompressed = await decompress(compressedData)
 * ```
 */
export async function decompress(
  input: Uint8Array | ArrayBuffer,
  onProgress?: OnProgressCallback,
): Promise<string | Uint8Array> {
  return new Promise<string | Uint8Array>((resolve, reject) => {
    decompressCore(
      input,
      (result, error) => {
        if (error) return reject(error)
        if (result !== null && result !== undefined) return resolve(result)
        reject(new Error('Decompression failed: no result returned'))
      },
      onProgress,
    )
  })
}

/**
 * LZMA class with Promise-based API (for backward compatibility)
 *
 * @example
 * ```ts
 * import LZMA from 'lzma-web'
 * const lzma = new LZMA()
 * const compressed = await lzma.compress('Hello, World!')
 * const decompressed = await lzma.decompress(compressed)
 * ```
 */
export default class lzma {
  /**
   * Compress data using LZMA algorithm
   */
  compress = async (
    input: string | Uint8Array | ArrayBuffer,
    mode: CompressMode = 9,
    onProgress?: OnProgressCallback,
  ): Promise<Uint8Array> => {
    return compress(input, mode, onProgress)
  }

  /**
   * Decompress LZMA-compressed data
   */
  decompress = async (
    input: Uint8Array | ArrayBuffer,
    onProgress?: OnProgressCallback,
  ): Promise<string | Uint8Array> => {
    return decompress(input, onProgress)
  }

  /**
   * Callback-based API (for advanced use cases)
   */
  cb = {
    compress: compressCore,
    decompress: decompressCore,
  }
}
