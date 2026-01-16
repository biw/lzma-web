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
import { compress as lzmaWebCompress, decompress as lzmaWebDecompress } from '../src/index.js'
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
const smallText = fs.existsSync(smallTextPath) ? fs.readFileSync(smallTextPath, 'utf-8') : 'Hello, World! '.repeat(100)
const largeText = fs.existsSync(largeTextPath) ? fs.readFileSync(largeTextPath, 'utf-8') : 'Large text content '.repeat(10000)
const binaryData = fs.existsSync(binaryPath) ? fs.readFileSync(binaryPath) : Buffer.from(Array.from({ length: 500 }, () => Math.floor(Math.random() * 256)))

// Pre-compress data for decompression benchmarks
let smallTextCompressed: Uint8Array
let largeTextCompressed: Uint8Array

// Compression mode for LZMA (use mode 1 for speed in benchmarks)
const LZMA_MODE = 1

// Benchmark options
const benchOptions = { time: 3000, iterations: 5 }

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
  const module = await import('@sarakusha/lzma') as any
  // @sarakusha/lzma exports compress/decompress directly
  if (typeof module.compress === 'function') {
    sarakushaLzma = {
      compress: (data: string | Uint8Array, mode: number) =>
        new Promise((resolve, reject) => {
          module.compress(data, mode, (result: Uint8Array | null, error: Error | null) => {
            if (error) reject(error)
            else resolve(result)
          })
        }),
      decompress: (data: Uint8Array) =>
        new Promise((resolve, reject) => {
          module.decompress(data, (result: string | Uint8Array | null, error: Error | null) => {
            if (error) reject(error)
            else resolve(result)
          })
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
  const module = await import('lzma') as any
  // lzma package exports LZMA class as default
  const LZMAClass = module.default || module.LZMA
  if (typeof LZMAClass === 'function') {
    const lzma = new LZMAClass()
    originalLzma = {
      compress: (data: string | Uint8Array, mode: number) =>
        new Promise((resolve, reject) => {
          lzma.compress(data, mode, (result: Uint8Array | null, error: Error | null) => {
            if (error) reject(error)
            else resolve(result)
          })
        }),
      decompress: (data: Uint8Array) =>
        new Promise((resolve, reject) => {
          lzma.decompress(data, (result: string | Uint8Array | null, error: Error | null) => {
            if (error) reject(error)
            else resolve(result)
          })
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

beforeAll(async () => {
  // Pre-compress with lzma-web
  smallTextCompressed = compressSync(smallText, LZMA_MODE)
  largeTextCompressed = compressSync(largeText, LZMA_MODE)
})

// ============================================================================
// lzma-web Execution Modes - Small Text
// ============================================================================

describe('lzma-web Execution Modes - Small Text Compression', () => {
  bench(
    'lzma-web sync',
    () => {
      compressSync(smallText, LZMA_MODE)
    },
    benchOptions
  )

  bench(
    'lzma-web async',
    async () => {
      await lzmaWebCompress(smallText, LZMA_MODE)
    },
    benchOptions
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
      benchOptions
    )
  }
})

describe('lzma-web Execution Modes - Small Text Decompression', () => {
  bench(
    'lzma-web sync',
    () => {
      decompressSync(smallTextCompressed)
    },
    benchOptions
  )

  bench(
    'lzma-web async',
    async () => {
      await lzmaWebDecompress(smallTextCompressed)
    },
    benchOptions
  )

  if (hasWorkers) {
    bench(
      'lzma-web worker',
      async () => {
        const worker = createWorkerLZMA()
        try {
          await worker.decompress(smallTextCompressed)
        } finally {
          worker.terminate()
        }
      },
      benchOptions
    )
  }
})

// ============================================================================
// lzma-web Execution Modes - Large Text
// ============================================================================

describe('lzma-web Execution Modes - Large Text Compression', () => {
  bench(
    'lzma-web sync',
    () => {
      compressSync(largeText, LZMA_MODE)
    },
    benchOptions
  )

  bench(
    'lzma-web async',
    async () => {
      await lzmaWebCompress(largeText, LZMA_MODE)
    },
    benchOptions
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
      benchOptions
    )
  }
})

describe('lzma-web Execution Modes - Large Text Decompression', () => {
  bench(
    'lzma-web sync',
    () => {
      decompressSync(largeTextCompressed)
    },
    benchOptions
  )

  bench(
    'lzma-web async',
    async () => {
      await lzmaWebDecompress(largeTextCompressed)
    },
    benchOptions
  )

  if (hasWorkers) {
    bench(
      'lzma-web worker',
      async () => {
        const worker = createWorkerLZMA()
        try {
          await worker.decompress(largeTextCompressed)
        } finally {
          worker.terminate()
        }
      },
      benchOptions
    )
  }
})

// ============================================================================
// LZMA Library Comparison - Small Text Compression
// ============================================================================

describe('LZMA Library Comparison - Small Text Compression', () => {
  bench(
    'lzma-web (sync)',
    () => {
      compressSync(smallText, LZMA_MODE)
    },
    benchOptions
  )

  if (sarakushaLzma) {
    bench(
      '@sarakusha/lzma',
      async () => {
        await sarakushaLzma!.compress(smallText, LZMA_MODE)
      },
      benchOptions
    )
  }

  if (originalLzma) {
    bench(
      'lzma (original)',
      async () => {
        await originalLzma!.compress(smallText, LZMA_MODE)
      },
      benchOptions
    )
  }

  if (napiLzma) {
    bench(
      '@napi-rs/lzma',
      async () => {
        await napiLzma!.compress(Buffer.from(smallText))
      },
      benchOptions
    )
  }

  if (lzmaNative) {
    bench(
      'lzma-native',
      async () => {
        await lzmaNative!.compress(smallText)
      },
      benchOptions
    )
  }
})

// ============================================================================
// LZMA Library Comparison - Large Text Compression
// ============================================================================

describe('LZMA Library Comparison - Large Text Compression', () => {
  bench(
    'lzma-web (sync)',
    () => {
      compressSync(largeText, LZMA_MODE)
    },
    benchOptions
  )

  if (sarakushaLzma) {
    bench(
      '@sarakusha/lzma',
      async () => {
        await sarakushaLzma!.compress(largeText, LZMA_MODE)
      },
      benchOptions
    )
  }

  if (originalLzma) {
    bench(
      'lzma (original)',
      async () => {
        await originalLzma!.compress(largeText, LZMA_MODE)
      },
      benchOptions
    )
  }

  if (napiLzma) {
    bench(
      '@napi-rs/lzma',
      async () => {
        await napiLzma!.compress(Buffer.from(largeText))
      },
      benchOptions
    )
  }

  if (lzmaNative) {
    bench(
      'lzma-native',
      async () => {
        await lzmaNative!.compress(largeText)
      },
      benchOptions
    )
  }
})

// ============================================================================
// LZMA Library Comparison - Small Text Decompression
// ============================================================================

describe('LZMA Library Comparison - Small Text Decompression', () => {
  bench(
    'lzma-web (sync)',
    () => {
      decompressSync(smallTextCompressed)
    },
    benchOptions
  )

  if (sarakushaLzma) {
    bench(
      '@sarakusha/lzma',
      async () => {
        await sarakushaLzma!.decompress(smallTextCompressed)
      },
      benchOptions
    )
  }

  if (originalLzma) {
    bench(
      'lzma (original)',
      async () => {
        await originalLzma!.decompress(smallTextCompressed)
      },
      benchOptions
    )
  }

  if (napiLzma) {
    bench(
      '@napi-rs/lzma',
      async () => {
        await napiLzma!.decompress(Buffer.from(smallTextCompressed))
      },
      benchOptions
    )
  }

  if (lzmaNative) {
    bench(
      'lzma-native',
      async () => {
        await lzmaNative!.decompress(Buffer.from(smallTextCompressed))
      },
      benchOptions
    )
  }
})

// ============================================================================
// LZMA Library Comparison - Large Text Decompression
// ============================================================================

describe('LZMA Library Comparison - Large Text Decompression', () => {
  bench(
    'lzma-web (sync)',
    () => {
      decompressSync(largeTextCompressed)
    },
    benchOptions
  )

  if (sarakushaLzma) {
    bench(
      '@sarakusha/lzma',
      async () => {
        await sarakushaLzma!.decompress(largeTextCompressed)
      },
      benchOptions
    )
  }

  if (originalLzma) {
    bench(
      'lzma (original)',
      async () => {
        await originalLzma!.decompress(largeTextCompressed)
      },
      benchOptions
    )
  }

  if (napiLzma) {
    bench(
      '@napi-rs/lzma',
      async () => {
        await napiLzma!.decompress(Buffer.from(largeTextCompressed))
      },
      benchOptions
    )
  }

  if (lzmaNative) {
    bench(
      'lzma-native',
      async () => {
        await lzmaNative!.decompress(Buffer.from(largeTextCompressed))
      },
      benchOptions
    )
  }
})

// ============================================================================
// LZMA Library Comparison - Binary Data Compression
// ============================================================================

describe('LZMA Library Comparison - Binary Data Compression', () => {
  bench(
    'lzma-web (sync)',
    () => {
      compressSync(binaryData, LZMA_MODE)
    },
    benchOptions
  )

  if (napiLzma) {
    bench(
      '@napi-rs/lzma',
      async () => {
        await napiLzma!.compress(binaryData)
      },
      benchOptions
    )
  }

  if (lzmaNative) {
    bench(
      'lzma-native',
      async () => {
        await lzmaNative!.compress(binaryData)
      },
      benchOptions
    )
  }
})

// ============================================================================
// Compression Ratio Comparison
// ============================================================================

describe('LZMA Compression Ratio by Mode', () => {
  bench(
    'Calculate compression ratios',
    () => {
      const originalSize = Buffer.byteLength(largeText, 'utf-8')

      // lzma-web at different modes
      const mode1 = compressSync(largeText, 1)
      const mode5 = compressSync(largeText, 5)
      const mode9 = compressSync(largeText, 9)

      console.log(`\nCompression Ratios for large-kjv.txt (${(originalSize / 1024).toFixed(0)} KB):`)
      console.log(`  Mode 1: ${((mode1.length / originalSize) * 100).toFixed(1)}% (${(mode1.length / 1024).toFixed(0)} KB)`)
      console.log(`  Mode 5: ${((mode5.length / originalSize) * 100).toFixed(1)}% (${(mode5.length / 1024).toFixed(0)} KB)`)
      console.log(`  Mode 9: ${((mode9.length / originalSize) * 100).toFixed(1)}% (${(mode9.length / 1024).toFixed(0)} KB)`)
    },
    { iterations: 1, time: 1000 }
  )
})
