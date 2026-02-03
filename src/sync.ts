/**
 * Synchronous LZMA compression/decompression API
 *
 * These functions block until the operation completes.
 * For large data, consider using the async API instead.
 */

import {
  compress as compressCore,
  decompress as decompressCore,
} from './lzma_main.js'
import type { CompressMode } from './types.js'

/**
 * Compress data synchronously using LZMA algorithm
 *
 * @param input - Data to compress (string, Uint8Array, or ArrayBuffer)
 * @param mode - Compression level from 1 (fastest) to 9 (best compression). Default is 9.
 * @returns Compressed data as Uint8Array
 *
 * @example
 * ```ts
 * import { compressSync } from 'lzma-web/sync'
 * const compressed = compressSync('Hello, World!', 1)
 * ```
 */
export function compressSync(
  input: string | Uint8Array | ArrayBuffer,
  mode: CompressMode = 9,
): Uint8Array {
  // Call without callbacks to get synchronous behavior
  const result = compressCore(input, mode)
  if (!(result instanceof Uint8Array)) {
    throw new Error('Compression failed: unexpected result type')
  }
  return result
}

/**
 * Decompress LZMA-compressed data synchronously
 *
 * @param input - Compressed data (Uint8Array or ArrayBuffer)
 * @returns Decompressed data as string (if valid UTF-8) or Uint8Array (if binary)
 *
 * @example
 * ```ts
 * import { decompressSync } from 'lzma-web/sync'
 * const decompressed = decompressSync(compressedData)
 * ```
 */
export function decompressSync(
  input: Uint8Array | ArrayBuffer,
): string | Uint8Array {
  // Call without callbacks to get synchronous behavior
  const result = decompressCore(input)
  if (result === undefined || result === null) {
    throw new Error('Decompression failed: no result returned')
  }
  return result
}
