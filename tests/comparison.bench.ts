/**
 * LZMA Library Comparison Benchmarks
 *
 * Compares lzma-web against other LZMA implementations.
 * Tests different execution modes (sync, async, worker) and measures:
 * - Compression speed (ops/sec)
 * - Decompression speed (ops/sec)
 * - Compression ratio
 */

import { describe, bench, beforeAll } from 'vitest'
import fs from 'fs'
import path from 'path'
import url from 'url'

// lzma-web imports
import {
  compress as lzmaWebCompress,
  decompress as lzmaWebDecompress,
} from '../src/index.js'
import { compressSync, decompressSync } from '../src/sync.js'
import { createWorkerLZMA } from '../src/worker-api.js'

const __filename = url.fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const pathToFiles = path.join(__dirname, 'files')

// Test data
const smallTextPath = path.join(pathToFiles, 'sample_text.txt')
const largeTextPath = path.join(pathToFiles, 'large-kjv.txt')
const binaryPath = path.join(pathToFiles, 'binary')

// Load test files
const smallText = fs.existsSync(smallTextPath)
  ? fs.readFileSync(smallTextPath, 'utf-8')
  : 'Hello, World! '.repeat(100)
const largeText = fs.existsSync(largeTextPath)
  ? fs.readFileSync(largeTextPath, 'utf-8')
  : 'Large text content '.repeat(10000)
const binaryData = fs.existsSync(binaryPath)
  ? fs.readFileSync(binaryPath)
  : Buffer.from(
      Array.from({ length: 500 }, () => Math.floor(Math.random() * 256)),
    )

// Pre-compress data only for the decompression suites that need it. This keeps
// compression-only benchmark jobs from paying the large-text setup cost.
let smallTextCompressed: Uint8Array | undefined
let largeTextCompressed: Uint8Array | undefined

// Compression mode for LZMA (use mode 1 for speed in benchmarks)
const LZMA_MODE = 1

// Benchmark options
const benchOptions = { time: 3000, iterations: 5 }
const benchmarkGroup = process.env.BENCHMARK_GROUP
const compressionRatioModes = [1, 5, 9] as const
const compressionRatioOutput = process.env.COMPRESSION_RATIO_OUTPUT
// Ratios are deterministic, while compression performance is measured by the
// dedicated execution-mode benchmarks. Avoid Tinybench's default warm-up work
// here so each ratio mode is compressed exactly once per revision.
const compressionRatioBenchOptions = {
  iterations: 1,
  time: 0,
  warmupIterations: 0,
  warmupTime: 0,
}
let compressionRatioWritten = false

const shouldRunGroup = (group: string) =>
  !benchmarkGroup || benchmarkGroup === group

const shouldRunCompressionRatioMode = (mode: number) =>
  !benchmarkGroup ||
  benchmarkGroup === 'comparison:compression-ratio' ||
  benchmarkGroup === `comparison:compression-ratio:mode:${mode}`

const writeCompressionRatio = (mode: number, compressed: Uint8Array) => {
  if (!compressionRatioOutput || compressionRatioWritten) return

  const originalBytes = Buffer.byteLength(largeText, 'utf-8')
  const compressedBytes = compressed.length

  fs.writeFileSync(
    compressionRatioOutput,
    `${JSON.stringify(
      {
        input: 'large-kjv.txt',
        mode,
        originalBytes,
        compressedBytes,
        ratioPercent: (compressedBytes / originalBytes) * 100,
      },
      null,
      2,
    )}\n`,
  )
  compressionRatioWritten = true
}

// Check if Workers are available (browser environment)
const hasWorkers = typeof Worker !== 'undefined'

// ============================================================================
// Helper functions to load optional LZMA libraries
// ============================================================================

// Try to load @sarakusha/lzma (ES6 wrapper)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let sarakushaLzma: { compress: Function; decompress: Function } | null = null
try {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const module = (await import('@sarakusha/lzma')) as any
  // @sarakusha/lzma exports compress/decompress directly
  if (typeof module.compress === 'function') {
    sarakushaLzma = {
      compress: (data: string | Uint8Array, mode: number) =>
        new Promise((resolve, reject) => {
          module.compress(
            data,
            mode,
            (result: Uint8Array | null, error: Error | null) => {
              if (error) reject(error)
              else resolve(result)
            },
          )
        }),
      decompress: (data: Uint8Array) =>
        new Promise((resolve, reject) => {
          module.decompress(
            data,
            (result: string | Uint8Array | null, error: Error | null) => {
              if (error) reject(error)
              else resolve(result)
            },
          )
        }),
    }
  }
} catch {
  // Library not available
}

// Try to load original lzma (LZMA-JS)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let originalLzma: { compress: Function; decompress: Function } | null = null
try {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const module = (await import('lzma')) as any
  // lzma package exports LZMA class as default
  const LZMAClass = module.default || module.LZMA
  if (typeof LZMAClass === 'function') {
    const lzma = new LZMAClass()
    originalLzma = {
      compress: (data: string | Uint8Array, mode: number) =>
        new Promise((resolve, reject) => {
          lzma.compress(
            data,
            mode,
            (result: Uint8Array | null, error: Error | null) => {
              if (error) reject(error)
              else resolve(result)
            },
          )
        }),
      decompress: (data: Uint8Array) =>
        new Promise((resolve, reject) => {
          lzma.decompress(
            data,
            (result: string | Uint8Array | null, error: Error | null) => {
              if (error) reject(error)
              else resolve(result)
            },
          )
        }),
    }
  }
} catch {
  // Library not available
}

// Try to load @napi-rs/lzma (Rust native)
let napiLzma: { compress: Function; decompress: Function } | null = null
try {
  const module = await import('@napi-rs/lzma/lzma')
  napiLzma = {
    compress: module.compress,
    decompress: module.decompress,
  }
} catch {
  // Library not available (Node.js only)
}

// Try to load lzma-native (C++ native)
let lzmaNative: { compress: Function; decompress: Function } | null = null
try {
  const module = await import('lzma-native')
  lzmaNative = {
    compress: (data: Buffer | string) => module.default.compress(data),
    decompress: (data: Buffer) => module.default.decompress(data),
  }
} catch {
  // Library not available (Node.js only, requires native build)
}

// ============================================================================
// Pre-compress data for decompression benchmarks
// ============================================================================

const getSmallTextCompressed = () => {
  smallTextCompressed ??= compressSync(smallText, LZMA_MODE)
  return smallTextCompressed
}

const getLargeTextCompressed = () => {
  largeTextCompressed ??= compressSync(largeText, LZMA_MODE)
  return largeTextCompressed
}

// ============================================================================
// lzma-web Execution Modes - Small Text
// ============================================================================

describe.skipIf(!shouldRunGroup('comparison:execution-small-compression'))(
  'lzma-web Execution Modes - Small Text Compression',
  () => {
    bench(
      'lzma-web sync',
      () => {
        compressSync(smallText, LZMA_MODE)
      },
      benchOptions,
    )

    bench(
      'lzma-web async',
      async () => {
        await lzmaWebCompress(smallText, LZMA_MODE)
      },
      benchOptions,
    )

    if (hasWorkers) {
      bench(
        'lzma-web worker',
        async () => {
          const worker = createWorkerLZMA()
          try {
            await worker.compress(smallText, LZMA_MODE)
          } finally {
            worker.terminate()
          }
        },
        benchOptions,
      )
    }
  },
)

describe.skipIf(!shouldRunGroup('comparison:execution-small-decompression'))(
  'lzma-web Execution Modes - Small Text Decompression',
  () => {
    beforeAll(() => {
      getSmallTextCompressed()
    })

    bench(
      'lzma-web sync',
      () => {
        decompressSync(getSmallTextCompressed())
      },
      benchOptions,
    )

    bench(
      'lzma-web async',
      async () => {
        await lzmaWebDecompress(getSmallTextCompressed())
      },
      benchOptions,
    )

    if (hasWorkers) {
      bench(
        'lzma-web worker',
        async () => {
          const worker = createWorkerLZMA()
          try {
            await worker.decompress(getSmallTextCompressed())
          } finally {
            worker.terminate()
          }
        },
        benchOptions,
      )
    }
  },
)

// ============================================================================
// lzma-web Execution Modes - Large Text
// ============================================================================

describe.skipIf(!shouldRunGroup('comparison:execution-large-compression'))(
  'lzma-web Execution Modes - Large Text Compression',
  () => {
    bench(
      'lzma-web sync',
      () => {
        compressSync(largeText, LZMA_MODE)
      },
      benchOptions,
    )

    bench(
      'lzma-web async',
      async () => {
        await lzmaWebCompress(largeText, LZMA_MODE)
      },
      benchOptions,
    )

    if (hasWorkers) {
      bench(
        'lzma-web worker',
        async () => {
          const worker = createWorkerLZMA()
          try {
            await worker.compress(largeText, LZMA_MODE)
          } finally {
            worker.terminate()
          }
        },
        benchOptions,
      )
    }
  },
)

describe.skipIf(!shouldRunGroup('comparison:execution-large-decompression'))(
  'lzma-web Execution Modes - Large Text Decompression',
  () => {
    beforeAll(() => {
      getLargeTextCompressed()
    })

    bench(
      'lzma-web sync',
      () => {
        decompressSync(getLargeTextCompressed())
      },
      benchOptions,
    )

    bench(
      'lzma-web async',
      async () => {
        await lzmaWebDecompress(getLargeTextCompressed())
      },
      benchOptions,
    )

    if (hasWorkers) {
      bench(
        'lzma-web worker',
        async () => {
          const worker = createWorkerLZMA()
          try {
            await worker.decompress(getLargeTextCompressed())
          } finally {
            worker.terminate()
          }
        },
        benchOptions,
      )
    }
  },
)

// ============================================================================
// LZMA Library Comparison - Small Text Compression
// ============================================================================

describe.skipIf(!shouldRunGroup('comparison:libraries-small-compression'))(
  'LZMA Library Comparison - Small Text Compression',
  () => {
    bench(
      'lzma-web (sync)',
      () => {
        compressSync(smallText, LZMA_MODE)
      },
      benchOptions,
    )

    if (sarakushaLzma) {
      bench(
        '@sarakusha/lzma',
        async () => {
          await sarakushaLzma!.compress(smallText, LZMA_MODE)
        },
        benchOptions,
      )
    }

    if (originalLzma) {
      bench(
        'lzma (original)',
        async () => {
          await originalLzma!.compress(smallText, LZMA_MODE)
        },
        benchOptions,
      )
    }

    if (napiLzma) {
      bench(
        '@napi-rs/lzma',
        async () => {
          await napiLzma!.compress(Buffer.from(smallText))
        },
        benchOptions,
      )
    }

    if (lzmaNative) {
      bench(
        'lzma-native',
        async () => {
          await lzmaNative!.compress(smallText)
        },
        benchOptions,
      )
    }
  },
)

// ============================================================================
// LZMA Library Comparison - Large Text Compression
// ============================================================================

describe.skipIf(!shouldRunGroup('comparison:libraries-large-compression'))(
  'LZMA Library Comparison - Large Text Compression',
  () => {
    bench(
      'lzma-web (sync)',
      () => {
        compressSync(largeText, LZMA_MODE)
      },
      benchOptions,
    )

    if (sarakushaLzma) {
      bench(
        '@sarakusha/lzma',
        async () => {
          await sarakushaLzma!.compress(largeText, LZMA_MODE)
        },
        benchOptions,
      )
    }

    if (originalLzma) {
      bench(
        'lzma (original)',
        async () => {
          await originalLzma!.compress(largeText, LZMA_MODE)
        },
        benchOptions,
      )
    }

    if (napiLzma) {
      bench(
        '@napi-rs/lzma',
        async () => {
          await napiLzma!.compress(Buffer.from(largeText))
        },
        benchOptions,
      )
    }

    if (lzmaNative) {
      bench(
        'lzma-native',
        async () => {
          await lzmaNative!.compress(largeText)
        },
        benchOptions,
      )
    }
  },
)

// ============================================================================
// LZMA Library Comparison - Small Text Decompression
// ============================================================================

describe.skipIf(!shouldRunGroup('comparison:libraries-small-decompression'))(
  'LZMA Library Comparison - Small Text Decompression',
  () => {
    beforeAll(() => {
      getSmallTextCompressed()
    })

    bench(
      'lzma-web (sync)',
      () => {
        decompressSync(getSmallTextCompressed())
      },
      benchOptions,
    )

    if (sarakushaLzma) {
      bench(
        '@sarakusha/lzma',
        async () => {
          await sarakushaLzma!.decompress(getSmallTextCompressed())
        },
        benchOptions,
      )
    }

    if (originalLzma) {
      bench(
        'lzma (original)',
        async () => {
          await originalLzma!.decompress(getSmallTextCompressed())
        },
        benchOptions,
      )
    }

    if (napiLzma) {
      bench(
        '@napi-rs/lzma',
        async () => {
          await napiLzma!.decompress(Buffer.from(getSmallTextCompressed()))
        },
        benchOptions,
      )
    }

    if (lzmaNative) {
      bench(
        'lzma-native',
        async () => {
          await lzmaNative!.decompress(Buffer.from(getSmallTextCompressed()))
        },
        benchOptions,
      )
    }
  },
)

// ============================================================================
// LZMA Library Comparison - Large Text Decompression
// ============================================================================

describe.skipIf(!shouldRunGroup('comparison:libraries-large-decompression'))(
  'LZMA Library Comparison - Large Text Decompression',
  () => {
    beforeAll(() => {
      getLargeTextCompressed()
    })

    bench(
      'lzma-web (sync)',
      () => {
        decompressSync(getLargeTextCompressed())
      },
      benchOptions,
    )

    if (sarakushaLzma) {
      bench(
        '@sarakusha/lzma',
        async () => {
          await sarakushaLzma!.decompress(getLargeTextCompressed())
        },
        benchOptions,
      )
    }

    if (originalLzma) {
      bench(
        'lzma (original)',
        async () => {
          await originalLzma!.decompress(getLargeTextCompressed())
        },
        benchOptions,
      )
    }

    if (napiLzma) {
      bench(
        '@napi-rs/lzma',
        async () => {
          await napiLzma!.decompress(Buffer.from(getLargeTextCompressed()))
        },
        benchOptions,
      )
    }

    if (lzmaNative) {
      bench(
        'lzma-native',
        async () => {
          await lzmaNative!.decompress(Buffer.from(getLargeTextCompressed()))
        },
        benchOptions,
      )
    }
  },
)

// ============================================================================
// LZMA Library Comparison - Binary Data Compression
// ============================================================================

describe.skipIf(!shouldRunGroup('comparison:libraries-binary-compression'))(
  'LZMA Library Comparison - Binary Data Compression',
  () => {
    bench(
      'lzma-web (sync)',
      () => {
        compressSync(binaryData, LZMA_MODE)
      },
      benchOptions,
    )

    if (napiLzma) {
      bench(
        '@napi-rs/lzma',
        async () => {
          await napiLzma!.compress(binaryData)
        },
        benchOptions,
      )
    }

    if (lzmaNative) {
      bench(
        'lzma-native',
        async () => {
          await lzmaNative!.compress(binaryData)
        },
        benchOptions,
      )
    }
  },
)

// ============================================================================
// Compression Ratio Comparison
// ============================================================================

describe('LZMA Compression Ratio by Mode', () => {
  compressionRatioModes.forEach((mode) => {
    bench.skipIf(!shouldRunCompressionRatioMode(mode))(
      `Calculate compression ratio (mode ${mode})`,
      () => {
        const compressed = compressSync(largeText, mode)
        writeCompressionRatio(mode, compressed)
      },
      compressionRatioBenchOptions,
    )
  })
})
