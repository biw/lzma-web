# lzma-web

[![CI][ci-badge]][ci]
[![version][version-badge]][package]
[![npm-downloads][npm-downloads-badge]][package]

The fastest isomorphic LZMA compression library for JavaScript. Works in browsers, Electron, and Node.js with a tree-shakeable, Promise-based API and optional Web Worker support.

## Features

- **Multiple APIs** - Promise-based, synchronous, and Web Worker APIs
- **Tree-shakeable** - Import only compression or decompression to reduce bundle size
- **TypeScript** - Full type definitions included
- **Web Workers** - Optional, explicit off-main-thread compression in browsers
- **Universal** - Works in browsers, Electron, and Node.js
- **Electron-tested** - CI includes a packaged Electron smoke test with `asar`
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

### Runtime Support

For Node.js usage, lzma-web supports Node.js 18 and later. Release CI runs on
Node.js 26; use the included `.nvmrc` for local development. The
`lzma-web/worker` entry point additionally requires browser `Worker` support.

## Quick Start

```javascript
import { compress, decompress } from 'lzma-web'

// Compress a string
const compressed = await compress('Hello, World!')

// Decompress back to original
const decompressed = await decompress(compressed)

console.log(decompressed) // 'Hello, World!'
```

## Migrating from v3

Version 4 replaces the default `LZMA` class with named functions. It also no
longer creates a Web Worker automatically.

```javascript
// v3
import LZMA from 'lzma-web'

const lzma = new LZMA()
const compressedV3 = await lzma.compress('Hello, World!', 9)

// v4
import { compress } from 'lzma-web'

const compressedV4 = await compress('Hello, World!', 9)
```

To keep compression off the browser's main thread, use the explicit
`lzma-web/worker` entry point and call `terminate()` when finished. The v3
`.cb` callback API and internal `dist/*` imports are not supported in v4;
use Promise APIs and the documented entry points below instead.

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

The default entry point provides Promise-based compression and decompression
on the current thread. It does not create a Web Worker; use
`lzma-web/worker` when keeping browser UI work off the main thread matters.

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

Use this browser-focused entry point to run compression and decompression in a
Web Worker. It is created lazily on the first operation and must be terminated
when no longer needed.

```javascript
import { createWorkerLZMA } from 'lzma-web/worker'

// Create a worker handle (the Worker is created on the first operation)
const lzma = createWorkerLZMA()

try {
  // Both operations run in the Web Worker
  const compressed = await lzma.compress('Hello, World!', 9)
  const decompressed = await lzma.decompress(compressed)
} finally {
  // Clean up when done
  lzma.terminate()
}
```

> **Note:** This entry point rejects operations when Web Workers are
> unavailable. Use `lzma-web` or `lzma-web/sync` in environments without
> Worker support. The Worker is backed by a `blob:` URL, so sites with a
> Content Security Policy must allow `blob:` worker sources.

---

### Tree-Shaking Modules

For bundle size optimization, import only what you need.

#### Compression Only (`lzma-web/compress`)

```javascript
import { compressSync, compressAsync } from 'lzma-web/compress'

// Sync compression (blocking)
const compressedSync = compressSync('Hello, World!', 5)

// Async with progress callback
const compressedWithProgress = await compressAsync('Hello, World!', 5, (p) => {
  console.log(`Progress: ${p * 100}%`)
})
```

`lzma-web/compress` also exports the low-level `compress` function. Without a
completion callback, it is synchronous; prefer `compressSync` or
`compressAsync` for an explicit execution model.

#### Decompression Only (`lzma-web/decompress`)

```javascript
import { decompressSync, decompressAsync } from 'lzma-web/decompress'

// Sync decompression (blocking)
const decompressedSync = decompressSync(compressedData)

// Async with progress callback
const decompressedWithProgress = await decompressAsync(compressedData, (p) => {
  console.log(`Progress: ${p >= 0 ? p * 100 + '%' : 'unknown'}`)
})
```

`lzma-web/decompress` also exports the low-level `decompress` function. Without
a completion callback, it is synchronous; prefer `decompressSync` or
`decompressAsync` for an explicit execution model.

> **Tip:** Use these modules when you only need one operation. This significantly reduces bundle size through tree-shaking.

---

## Web Workers

### Choosing an Execution Model

- **`lzma-web`** — Promise-based work on the current thread. This is the
  general-purpose API, but it does not create a Worker.
- **`lzma-web/worker`** — Promise-based work in a Web Worker. Use this in a
  browser when compression must not block UI work.
- **`lzma-web/sync`** — Blocking, synchronous work. Use this only where
  blocking is acceptable.

The worker entry point has no main-thread fallback: it rejects an operation if
the environment does not provide `Worker` support.

### Manual Worker Management

Use `lzma-web/worker` when you need explicit control:

```javascript
import { createWorkerLZMA } from 'lzma-web/worker'

// Each handle creates its own Worker lazily, on its first operation
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
| `lzma-web/compress` | Only compressing data | Excludes decompression code |
| `lzma-web/decompress` | Only decompressing data | Excludes compression code |
| `lzma-web/sync` | Synchronous operations only | Similar to main |

Example for a client that only decompresses server-compressed data:

```javascript
// Imports decompression code only; this runs asynchronously on the current thread
import { decompressAsync } from 'lzma-web/decompress'

const data = await decompressAsync(serverResponse)
```

---

## Performance

As of March 2026, lzma-web is the fastest isomorphic (browser + Electron + Node.js) LZMA library we could find. It consistently outperforms other pure-JS implementations by 2–5x across compression and decompression workloads.

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

[ci-badge]: https://badgen.net/github/checks/biw/lzma-web
[ci]: https://github.com/biw/lzma-web/actions?query=branch%3Amain
[version-badge]: https://badgen.net/npm/v/lzma-web
[package]: https://www.npmjs.com/package/lzma-web
[npm-downloads-badge]: https://badgen.net/npm/dt/lzma-web
