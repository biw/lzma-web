/**
 * LZMA Compression Only Entry Point
 *
 * This module re-exports only compression functionality for tree-shaking.
 * Use this when you only need compression and want to minimize bundle size.
 *
 * @example
 * ```ts
 * import { compress, compressSync } from 'lzma-web/compress'
 *
 * // Async compression
 * const compressed = await compress('Hello, World!', 9)
 *
 * // Sync compression
 * const compressedSync = compressSync('Hello, World!', 1)
 * ```
 */

// Re-export from generated compress-only module
export { compress } from './generated/compress-only.js'

// Also export sync wrapper
import { compress as compressCore } from './generated/compress-only.js'
import type { CompressMode, OnProgressCallback } from './types.js'

export type { CompressMode, OnProgressCallback } from './types.js'

/**
 * Compress data synchronously using LZMA algorithm
 */
export function compressSync(
  input: string | Uint8Array | ArrayBuffer,
  mode: CompressMode = 9,
): Uint8Array {
  const result = compressCore(input, mode)
  if (!(result instanceof Uint8Array)) {
    throw new Error('Compression failed: unexpected result type')
  }
  return result
}

/**
 * Compress data asynchronously with optional progress callback
 */
export async function compressAsync(
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
