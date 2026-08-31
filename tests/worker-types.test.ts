import { describe, expectTypeOf, test } from 'vitest'
import { createWorkerLZMA } from '../src/worker-api.js'
import type {
  CompressMode,
  OnProgressCallback,
  WorkerLZMA,
} from '../src/types.js'

describe('Worker API types', () => {
  test('createWorkerLZMA exposes the expected public shape', () => {
    const lzma = createWorkerLZMA()

    expectTypeOf(lzma).toEqualTypeOf<WorkerLZMA>()
    expectTypeOf(lzma.compress).toEqualTypeOf<
      (
        input: string | Uint8Array | ArrayBuffer,
        mode?: CompressMode,
        onProgress?: OnProgressCallback,
      ) => Promise<Uint8Array>
    >()
    expectTypeOf(lzma.decompress).toEqualTypeOf<
      (
        input: Uint8Array | ArrayBuffer,
        onProgress?: OnProgressCallback,
      ) => Promise<string | Uint8Array>
    >()
    expectTypeOf(lzma.terminate).toEqualTypeOf<() => void>()
    expectTypeOf(lzma.worker).toEqualTypeOf<Worker | null>()
  })
})
