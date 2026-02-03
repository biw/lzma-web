export type CompressMode = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9

/**
 * Callback invoked when compression/decompression completes.
 *
 * On success: result contains the data, error is null
 * On failure: result is null, error contains the Error object
 *
 * Note: For successful decompression, result is string if the data is valid UTF-8,
 * otherwise it's a Uint8Array for binary data.
 */
export type OnFinishCallback = (
  result: Uint8Array | string | null,
  error: Error | null,
) => void

export type OnProgressCallback = (percent: number) => void

export interface WorkerLZMA {
  compress(
    input: string | Uint8Array | ArrayBuffer,
    mode?: CompressMode,
    onProgress?: OnProgressCallback,
  ): Promise<Uint8Array>

  decompress(
    input: Uint8Array | ArrayBuffer,
    onProgress?: OnProgressCallback,
  ): Promise<string | Uint8Array>

  terminate(): void
  readonly worker: Worker | null
}
