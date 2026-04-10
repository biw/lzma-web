# lzma-web

[![CI][ci-badge]][ci]
[![version][version-badge]][package]
[![bundlephobia][bundlephobia-badge]][bundlephobia]
[![MIT License][license-badge]][license]

The fastest isomorphic LZMA compression library for JavaScript. Works in browsers and Node.js with a tree-shakeable, Promise-based API and optional Web Worker support.

## Features

- **Multiple APIs** - Promise-based, synchronous, and Web Worker APIs
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

```javascript
import { compress, decompress } from 'lzma-web'

// Compress with default settings (mode 9)
const compressed = await compress('Hello, World!')

// Compress with specific compression level (1-9)
const fastCompressed = await compress('Hello, World!', 1)

// Decompress
const decompressed = await decompress(compressed)
```

#### Compression Levels

The second argument to `compress` controls the compression level (1–9). Higher levels compress more but take longer.

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

Default is **9** (best compression). Ratios are approximate and vary based on input data.

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

## Web Workers

### How It Works

The main `lzma-web` API automatically uses Web Workers in browsers to prevent blocking the UI thread. Workers are initialized lazily on first use.

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

## Performance

As of March 2026, lzma-web is the fastest isomorphic (browser + Node.js) LZMA library we could find. It consistently outperforms other pure-JS implementations by 2–5x across compression and decompression workloads.

| Library | Type | Small text compress | Large text (~4 MB) compress | Small text decompress |
|---------|------|--------------------:|----------------------------:|----------------------:|
| **lzma-web** | JS (isomorphic) | **71.8 ops/s** | **0.30 hz** | **380.6 ops/s** |
| `@sarakusha/lzma` | JS (isomorphic) | 33.3 ops/s | 0.19 hz | 190.3 ops/s |
| `lzma1` | JS (isomorphic) | 25.6 ops/s | 0.06 hz | 163.7 ops/s |
| `@napi-rs/lzma` | Rust (Node.js only) | 1,195 ops/s | 10.9 hz | 1,930 ops/s |
| `lzma-native` | C++ (Node.js only) | 334 ops/s | 0.68 hz | 2,727 ops/s |

All JS libraries benchmarked at compression level 1. Native solutions like `@napi-rs/lzma` and `lzma-native` are significantly faster in Node.js, but they require native binaries and don't run in the browser.

```bash
# Run the comparison benchmarks yourself
pnpm test:bench
```

---

## License

[MIT](https://github.com/biw/lzma-web/blob/main/LICENSE) — originally forked from [LZMA-JS](https://github.com/nmrugg/LZMA-JS) by [Nathan Rugg](https://github.com/nmrugg).

---

[ci-badge]: https://img.shields.io/github/actions/workflow/status/biw/lzma-web/ci.yml?branch=main&style=flat-square
[ci]: https://github.com/biw/lzma-web/actions/workflows/ci.yml
[version-badge]: https://img.shields.io/npm/v/lzma-web.svg?style=flat-square
[package]: https://www.npmjs.com/package/lzma-web
[license-badge]: https://img.shields.io/npm/l/lzma-web.svg?style=flat-square
[license]: https://github.com/biw/lzma-web/blob/main/LICENSE
[bundlephobia]: https://bundlephobia.com/result?p=lzma-web
[bundlephobia-badge]: https://img.shields.io/bundlephobia/minzip/lzma-web@latest?style=flat-square
