/**
 * LZMA Decompression Only Entry Point
 *
 * This module re-exports only decompression functionality for tree-shaking.
 * Use this when you only need decompression and want to minimize bundle size.
 *
 * @example
 * ```ts
 * import { decompress, decompressSync } from 'lzma-web/decompress'
 *
 * // Async decompression
 * const decompressed = await decompress(compressedData)
 *
 * // Sync decompression
 * const decompressedSync = decompressSync(compressedData)
 * ```
 */

// Re-export from generated decompress-only module
export { decompress } from './generated/decompress-only.js'

// Also export sync wrapper
import { decompress as decompressCore } from './generated/decompress-only.js'
import type { OnProgressCallback } from './types.js'

export type { OnProgressCallback } from './types.js'

/**
 * Decompress LZMA-compressed data synchronously
 */
export function decompressSync(
  input: Uint8Array | ArrayBuffer,
): string | Uint8Array {
  const result = decompressCore(input)
  if (result === undefined || result === null) {
    throw new Error('Decompression failed: no result returned')
  }
  return result
}

/**
 * Decompress LZMA-compressed data asynchronously with optional progress callback
 */
export async function decompressAsync(
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
