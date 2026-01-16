# lzma-web

[![CI][ci-badge]][ci]
[![version][version-badge]][package]
[![bundlephobia][bundlephobia-badge]][bundlephobia]
[![MIT License][license-badge]][license]

A JavaScript implementation of the Lempel-Ziv-Markov chain (LZMA) compression algorithm for browsers and Node.js.

**Originally forked from [LZMA-JS](https://github.com/nmrugg/LZMA-JS) by [Nathan Rugg](https://github.com/nmrugg).**

## Features

- **Multiple APIs** - Promise-based, synchronous, callback-based, and Web Worker APIs
- **Tree-shakeable** - Import only compression or decompression to reduce bundle size
- **TypeScript** - Full type definitions included
- **Web Workers** - Automatic off-main-thread compression in browsers
- **Universal** - Works in browsers and Node.js
- **Compatible** - Output compatible with the reference LZMA implementation

## Installation

```bash
# npm
npm install lzma-web

# yarn
yarn add lzma-web

# pnpm
pnpm add lzma-web
```

## Quick Start

```javascript
import { compress, decompress } from 'lzma-web'

// Compress a string
const compressed = await compress('Hello, World!')

// Decompress back to original
const decompressed = await decompress(compressed)

console.log(decompressed) // 'Hello, World!'
```

## API Reference

### Entry Points Overview

| Entry Point | Purpose | Best For |
|-------------|---------|----------|
| `lzma-web` | Default Promise-based API | General async usage |
| `lzma-web/sync` | Synchronous API | Node.js, small data, no async needed |
| `lzma-web/worker` | Web Worker API | Browser, keeping UI responsive |
| `lzma-web/compress` | Compression only | Bundle optimization (tree-shaking) |
| `lzma-web/decompress` | Decompression only | Bundle optimization (tree-shaking) |

---

### Main API (`lzma-web`)

The default entry point provides Promise-based compression and decompression.

#### Functional API

```javascript
import { compress, decompress } from 'lzma-web'

// Compress with default settings (mode 9)
const compressed = await compress('Hello, World!')

// Compress with specific compression level (1-9)
const fastCompressed = await compress('Hello, World!', 1)

// Decompress
const decompressed = await decompress(compressed)
```

#### Class-based API

```javascript
import LZMA from 'lzma-web'

const lzma = new LZMA()

const compressed = await lzma.compress('Hello, World!', 5)
const decompressed = await lzma.decompress(compressed)
```

#### With Progress Callbacks

```javascript
import { compress, decompress } from 'lzma-web'

// Compression with progress
const compressed = await compress(
  largeData,
  9,
  (progress) => {
    console.log(`Compressing: ${(progress * 100).toFixed(1)}%`)
  }
)

// Decompression with progress
const decompressed = await decompress(
  compressed,
  (progress) => {
    // progress is 0-1 for known size, or -1 if size is unknown
    if (progress >= 0) {
      console.log(`Decompressing: ${(progress * 100).toFixed(1)}%`)
    }
  }
)
```

#### Callback-based API

For advanced use cases where you need callback-style flow control:

```javascript
import LZMA from 'lzma-web'

const lzma = new LZMA()

lzma.cb.compress(
  'Hello, World!',
  9, // compression level (required for callback API)
  (result, error) => {
    if (error) {
      console.error('Compression failed:', error)
      return
    }
    console.log('Compressed:', result)
  },
  (progress) => {
    console.log(`Progress: ${(progress * 100).toFixed(1)}%`)
  }
)
```

#### Type Signatures

```typescript
function compress(
  input: string | Uint8Array | ArrayBuffer,
  mode?: CompressMode,
  onProgress?: OnProgressCallback
): Promise<Uint8Array>

function decompress(
  input: Uint8Array | ArrayBuffer,
  onProgress?: OnProgressCallback
): Promise<string | Uint8Array>
```

---

### Synchronous API (`lzma-web/sync`)

For blocking operations when you don't need async behavior.

```javascript
import { compressSync, decompressSync } from 'lzma-web/sync'

// Compress synchronously
const compressed = compressSync('Hello, World!', 1)

// Decompress synchronously
const decompressed = decompressSync(compressed)
```

> **Note:** Synchronous operations block the main thread. Use for small data or in Node.js environments where blocking is acceptable.

#### Type Signatures

```typescript
function compressSync(
  input: string | Uint8Array | ArrayBuffer,
  mode?: CompressMode
): Uint8Array

function decompressSync(
  input: Uint8Array | ArrayBuffer
): string | Uint8Array
```

---

### Web Worker API (`lzma-web/worker`)

Explicitly manage Web Worker lifecycle for browser applications.

```javascript
import { createWorkerLZMA } from 'lzma-web/worker'

// Create a worker instance
const lzma = createWorkerLZMA()

// Compress (runs in Web Worker)
const compressed = await lzma.compress('Hello, World!', 9)

// Decompress (runs in Web Worker)
const decompressed = await lzma.decompress(compressed)

// Clean up when done (important!)
lzma.terminate()
```

#### With Progress

```javascript
import { createWorkerLZMA } from 'lzma-web/worker'

const lzma = createWorkerLZMA()

const compressed = await lzma.compress(
  largeData,
  9,
  (progress) => console.log(`Progress: ${progress * 100}%`)
)

lzma.terminate()
```

#### WorkerLZMA Interface

```typescript
interface WorkerLZMA {
  compress(
    input: string | Uint8Array | ArrayBuffer,
    mode?: CompressMode,
    onProgress?: OnProgressCallback
  ): Promise<Uint8Array>

  decompress(
    input: Uint8Array | ArrayBuffer,
    onProgress?: OnProgressCallback
  ): Promise<string | Uint8Array>

  terminate(): void
  readonly worker: Worker | null
}
```

> **Note:** The Worker is created lazily on first operation. Call `terminate()` to clean up resources when you're done.

---

### Tree-Shaking Modules

For bundle size optimization, import only what you need.

#### Compression Only (`lzma-web/compress`)

```javascript
import { compress, compressSync, compressAsync } from 'lzma-web/compress'

// Async compression (callback internally handled)
const compressed = await compress('Hello, World!', 5)

// Sync compression (blocking)
const compressedSync = compressSync('Hello, World!', 5)

// Async with progress callback
const compressedWithProgress = await compressAsync('Hello, World!', 5, (p) => {
  console.log(`Progress: ${p * 100}%`)
})
```

#### Decompression Only (`lzma-web/decompress`)

```javascript
import { decompress, decompressSync, decompressAsync } from 'lzma-web/decompress'

// Async decompression
const decompressed = await decompress(compressedData)

// Sync decompression (blocking)
const decompressedSync = decompressSync(compressedData)

// Async with progress callback
const decompressedWithProgress = await decompressAsync(compressedData, (p) => {
  console.log(`Progress: ${p >= 0 ? p * 100 + '%' : 'unknown'}`)
})
```

> **Tip:** Use these modules when you only need one operation. This significantly reduces bundle size through tree-shaking.

---

## Types

### CompressMode

Compression level from 1 to 9:

```typescript
type CompressMode = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9
```

| Level | Speed | Compression Ratio | Use Case |
|-------|-------|-------------------|----------|
| 1 | Fastest | Lowest | Real-time compression, large files |
| 5 | Balanced | Good | General purpose |
| 9 | Slowest | Best | Archival, bandwidth-constrained |

Default is **9** (best compression).

### Input Types

All compression functions accept:

```typescript
string | Uint8Array | ArrayBuffer
```

- **string** - UTF-8 text (automatically encoded)
- **Uint8Array** - Binary data
- **ArrayBuffer** - Binary data

### Output Types

**Compression** always returns:

```typescript
Uint8Array // Compressed LZMA bytes
```

**Decompression** returns:

```typescript
string | Uint8Array
```

- Returns `string` if the decompressed data is valid UTF-8 text
- Returns `Uint8Array` if the data is binary or invalid UTF-8

### Progress Callback

```typescript
type OnProgressCallback = (percent: number) => void
```

- **Compression:** `percent` ranges from `0` to `1` (0% to 100%)
- **Decompression:** `percent` ranges from `0` to `1`, or `-1` if the uncompressed size is unknown

---

## Compression Levels

| Level | Memory Usage | Speed | Ratio |
|-------|-------------|-------|-------|
| 1 | ~1 MB | Fastest | ~40% |
| 2 | ~2 MB | Very Fast | ~42% |
| 3 | ~4 MB | Fast | ~45% |
| 4 | ~8 MB | Medium-Fast | ~48% |
| 5 | ~16 MB | Medium | ~50% |
| 6 | ~32 MB | Medium-Slow | ~52% |
| 7 | ~48 MB | Slow | ~53% |
| 8 | ~64 MB | Very Slow | ~54% |
| 9 | ~64 MB | Slowest | ~55% |

> **Note:** Ratios are approximate and vary significantly based on input data. Highly compressible data (text, repetitive content) achieves much better ratios than random or pre-compressed data.

---

## Error Handling

### Promise API

```javascript
import { compress, decompress } from 'lzma-web'

try {
  const compressed = await compress(data, 5)
  const decompressed = await decompress(compressed)
} catch (error) {
  console.error('LZMA operation failed:', error.message)
}
```

### Synchronous API

```javascript
import { compressSync, decompressSync } from 'lzma-web/sync'

try {
  const compressed = compressSync(data, 5)
  const decompressed = decompressSync(compressed)
} catch (error) {
  console.error('LZMA operation failed:', error.message)
}
```

### Callback API

```javascript
lzma.cb.decompress(
  data,
  (result, error) => {
    if (error) {
      console.error('Decompression failed:', error.message)
      return
    }
    console.log('Success:', result)
  }
)
```

Common errors:
- Invalid or corrupted LZMA data
- Truncated input data
- Unsupported LZMA format version

---

## Web Workers

### How It Works

The main `lzma-web` API automatically uses Web Workers in browsers to prevent blocking the UI thread. Workers are initialized lazily on first use.

### Browser Support

Web Workers are supported in all modern browsers. See [Can I Use: Web Workers](https://caniuse.com/webworkers).

### Fallback Behavior

- **Browser with Web Workers:** Operations run in a background thread
- **Browser without Web Workers:** Falls back to main thread (blocking)
- **Node.js:** Runs in main thread (no Worker support)

### Manual Worker Management

Use `lzma-web/worker` when you need explicit control:

```javascript
import { createWorkerLZMA } from 'lzma-web/worker'

// Each call creates a new Worker
const worker1 = createWorkerLZMA()
const worker2 = createWorkerLZMA()

// Run operations in parallel
const [result1, result2] = await Promise.all([
  worker1.compress(data1, 5),
  worker2.compress(data2, 5),
])

// Clean up
worker1.terminate()
worker2.terminate()
```

---

## Bundle Size Optimization

Choose the right entry point for your use case:

| Entry Point | Use Case | Bundle Impact |
|-------------|----------|---------------|
| `lzma-web` | Need both compress & decompress | Full library |
| `lzma-web/compress` | Only compressing data | ~50% smaller |
| `lzma-web/decompress` | Only decompressing data | ~50% smaller |
| `lzma-web/sync` | Synchronous operations only | Similar to main |

Example for a client that only decompresses server-compressed data:

```javascript
// Only imports decompression code - smaller bundle!
import { decompress } from 'lzma-web/decompress'

const data = await decompress(serverResponse)
```

---

## LZMA Format Compatibility

`lzma-web` produces output compatible with the reference LZMA implementation. You can:

- Compress with `lzma-web`, decompress with the `lzma` command-line tool
- Compress with `lzma` command-line tool, decompress with `lzma-web`

```bash
# Compress with lzma CLI
lzma -z < input.txt > compressed.lzma

# Decompress with lzma CLI
lzma -d < compressed.lzma > output.txt
```

### LZMA Header Format

The compressed output follows the standard LZMA format:
- Byte 0: Properties byte (lc, lp, pb)
- Bytes 1-4: Dictionary size (little-endian)
- Bytes 5-12: Uncompressed size (little-endian, 8 bytes)
- Remaining: Compressed data

---

## TypeScript

Full TypeScript support with exported types:

```typescript
import {
  compress,
  decompress,
  type CompressMode,
  type OnProgressCallback
} from 'lzma-web'

const mode: CompressMode = 5

const onProgress: OnProgressCallback = (percent) => {
  console.log(`${percent * 100}%`)
}

const compressed: Uint8Array = await compress('Hello', mode, onProgress)
const decompressed: string | Uint8Array = await decompress(compressed)
```

---

## Performance

This project includes automated benchmark tracking. See [PERFORMANCE.md](PERFORMANCE.md) for:

- Running benchmarks locally
- Performance tracking over time
- GitHub PR integration with automatic benchmark comparisons

```bash
# Run benchmarks
yarn test:bench

# Track performance over time
yarn test:perf
```

---

## Demos

Demo files are included in the `demos/` directory:

- `simple_demo.html` - Basic browser usage
- `advanced_demo.html` - Advanced features
- `simple_node_demo.js` - Node.js async example
- `simple_node_sync_demo.js` - Node.js sync example

Original live demos from LZMA-JS: [http://lzma-js.github.io/LZMA-JS/](http://lzma-js.github.io/LZMA-JS/)

---

## Contributing

```bash
# Clone the repository
git clone https://github.com/biw/lzma-web.git
cd lzma-web

# Install dependencies
yarn install

# Build
yarn build

# Run tests
yarn test

# Run tests in watch mode
yarn test:watch

# Run browser tests
yarn test:browser

# Run benchmarks
yarn test:bench

# Lint
yarn lint

# Type check
yarn type-check
```

---

## License

[MIT](https://github.com/biw/lzma-web/blob/main/LICENSE)

---

[ci-badge]: https://img.shields.io/github/actions/workflow/status/biw/lzma-web/ci.yml?branch=main&style=flat-square
[ci]: https://github.com/biw/lzma-web/actions/workflows/ci.yml
[version-badge]: https://img.shields.io/npm/v/lzma-web.svg?style=flat-square
[package]: https://www.npmjs.com/package/lzma-web
[license-badge]: https://img.shields.io/npm/l/lzma-web.svg?style=flat-square
[license]: https://github.com/biw/lzma-web/blob/main/LICENSE
[bundlephobia]: https://bundlephobia.com/result?p=lzma-web
[bundlephobia-badge]: https://img.shields.io/bundlephobia/minzip/lzma-web@latest?style=flat-square
