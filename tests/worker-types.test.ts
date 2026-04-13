import { attest } from '@ark/attest'
import { describe, test } from 'vitest'
import { createWorkerLZMA } from '../src/worker-api.js'
import type {
  CompressMode,
  OnProgressCallback,
  WorkerLZMA,
} from '../src/types.js'

describe('Worker API types', () => {
  test('createWorkerLZMA exposes the expected public shape', () => {
    const lzma = createWorkerLZMA()

    attest<WorkerLZMA>(lzma)
    attest<
      (
        input: string | Uint8Array | ArrayBuffer,
        mode?: CompressMode,
        onProgress?: OnProgressCallback,
      ) => Promise<Uint8Array>
    >(lzma.compress)
    attest<
      (
        input: Uint8Array | ArrayBuffer,
        onProgress?: OnProgressCallback,
      ) => Promise<string | Uint8Array>
    >(lzma.decompress)
    attest<() => void>(lzma.terminate)
    attest<Worker | null>(lzma.worker)
  })
})
