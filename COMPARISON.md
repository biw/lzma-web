# LZMA Library Comparison

This document compares lzma-web against other LZMA implementations, helping you choose the right tool for your use case.

## Quick Summary

| Library | Type | Browser | Node.js | Speed | Notes |
|---------|------|---------|---------|-------|-------|
| **lzma-web** | Pure JS | Yes | Yes | Baseline | Modern API, tree-shaking |
| **@napi-rs/lzma** | Rust native | No | Yes | ~27x faster | Best performance |
| **lzma-native** | C++ native | No | Yes | ~20x faster | Mature, multi-threaded |
| **@sarakusha/lzma** | Pure JS | Yes | Yes | Similar | ES6 wrapper |
| **lzma** (original) | Pure JS | Yes | Yes | Similar | Original LZMA-JS |

---

## lzma-web Execution Modes

lzma-web provides three execution modes, each with different trade-offs:

| Mode | Entry Point | Blocking | Best For |
|------|-------------|----------|----------|
| **Sync** | `lzma-web/sync` | Yes | Small data, Node.js scripts |
| **Async** | `lzma-web` | No | General usage, async workflows |
| **Worker** | `lzma-web/worker` | No | Large data in browsers |

### Mode Comparison

```
Small Text (~1KB):
┌────────────────────────────────────────────────────────────┐
│ Sync   ████████████████████████████████████████████  Fast  │
│ Async  ██████████████████████████████████████        Good  │
│ Worker ██████████████████████                        Slower│
└────────────────────────────────────────────────────────────┘
                      ↑ Worker overhead dominates for small data

Large Text (~4MB):
┌────────────────────────────────────────────────────────────┐
│ Sync   ████████████████████████████████████████████  ~Equal│
│ Async  ████████████████████████████████████████████  ~Equal│
│ Worker ████████████████████████████████████████████  ~Equal│
└────────────────────────────────────────────────────────────┘
                      ↑ Compression time dominates, worker overhead negligible
```

### Recommendations

- **Small data (<10KB):** Use `sync` or `async` - worker message passing overhead isn't worth it
- **Large data (>100KB):** Use `worker` in browsers to keep the UI responsive
- **Node.js:** Use `sync` for simplicity, or `async` if you need to handle other events concurrently

---

## When to Use Each Library

### Use lzma-web when:

- ✅ You need **browser support**
- ✅ You want a **modern Promise-based API**
- ✅ You need **tree-shaking** for bundle size optimization
- ✅ You're **decompressing pre-compressed data** (LZMA decompression is fast!)
- ✅ You want **TypeScript support** out of the box

### Use @napi-rs/lzma or lzma-native when:

- ✅ You're in a **Node.js-only environment**
- ✅ You need **maximum compression speed** (5-27x faster than pure JS)
- ✅ You're processing **large files server-side**
- ✅ Build time and native dependencies are acceptable

### Use original lzma package when:

- ✅ You're already using it and it works for you
- ✅ You need the exact same API as LZMA-JS

---

## Compression Ratio by Mode

Testing with a 4MB text file (King James Bible):

| Mode | Compressed Size | Ratio | Notes |
|------|-----------------|-------|-------|
| Mode 1 | 1,038 KB | 25.6% | Fastest |
| Mode 5 | 936 KB | 23.1% | Balanced |
| Mode 9 | 884 KB | 21.8% | Best compression |

All LZMA libraries produce identical output for the same mode.

---

## Speed Comparison

Approximate relative speeds (higher is better):

### Compression Speed
```
@napi-rs/lzma   ████████████████████████████████████████  ~27x (Rust)
lzma-native     ████████████████████████████████          ~20x (C++)
lzma-web        █                                          1x (baseline)
@sarakusha/lzma █                                          1x (pure JS)
lzma (original) █                                          1x (pure JS)
```

### Decompression Speed
```
lzma-native     ████████████████████████████████████████  ~9x
@napi-rs/lzma   ██████████████████████████████████████    ~7x
lzma-web        █████                                      1x (baseline)
```

**Key insight:** LZMA compression is slow, but decompression is relatively fast. Native libraries are significantly faster for both operations.

---

## LZMA Algorithm Characteristics

### Strengths

1. **Excellent compression ratio**
   - One of the best compression algorithms available
   - Excellent for text, code, and structured data

2. **Asymmetric speed profile**
   - Slow compression, faster decompression
   - Perfect for CDN/static asset delivery

3. **Deterministic output**
   - Same input always produces same output
   - Cache-friendly, good for content addressing

4. **Mature and stable**
   - Widely supported format
   - Well-tested over 20+ years

### Limitations

1. **Slow compression**
   - Not suitable for real-time compression
   - Use native libraries if speed is critical

2. **Memory intensive**
   - Mode 1: ~1 MB
   - Mode 5: ~16 MB
   - Mode 9: ~64 MB

3. **Not streaming**
   - Must load entire input into memory
   - Not suitable for very large files in browsers

4. **Single-threaded in JS**
   - Pure JS implementation can't use multiple cores
   - Native implementations support multi-threading

---

## Compression Modes Explained

| Mode | Dictionary Size | Memory | Speed | Use Case |
|------|-----------------|--------|-------|----------|
| 1 | 64 KB | ~1 MB | Fastest | Real-time, large files |
| 2 | 256 KB | ~2 MB | Very Fast | Quick compression |
| 3 | 1 MB | ~4 MB | Fast | General use |
| 4 | 2 MB | ~8 MB | Medium | Better ratio |
| 5 | 4 MB | ~16 MB | Medium | **Recommended default** |
| 6 | 8 MB | ~32 MB | Slow | Good ratio |
| 7 | 16 MB | ~48 MB | Very Slow | High ratio |
| 8 | 32 MB | ~64 MB | Slowest | Very high ratio |
| 9 | 64 MB | ~64 MB | Slowest | **Maximum compression** |

### Mode Selection Guide

- **Mode 1:** When you need to compress quickly and ratio doesn't matter much
- **Mode 5:** Good balance of speed and compression (recommended)
- **Mode 9:** When you're compressing once for permanent storage/distribution

---

## Bundle Size Impact

When using tree-shaking:

| Import | Bundle Size (approx) |
|--------|---------------------|
| Full library (`lzma-web`) | ~100 KB |
| Compress only (`lzma-web/compress`) | ~65 KB |
| Decompress only (`lzma-web/decompress`) | ~45 KB |
| Sync API (`lzma-web/sync`) | ~100 KB |

**Tip:** If you're only decompressing pre-compressed data (common use case), import from `lzma-web/decompress` to reduce bundle size by ~55%.

---

## Running Benchmarks

Run comparison benchmarks yourself:

```bash
# Run all comparison benchmarks
pnpm test:compare

# Run with detailed output
pnpm test:bench tests/comparison.bench.ts --reporter=verbose
```

---

## Library Versions

| Library | Version | Notes |
|---------|---------|-------|
| lzma-web | 3.0.1 | This package |
| @napi-rs/lzma | ^1.4.5 | Rust native bindings |
| lzma-native | ^8.0.6 | C++ native bindings |
| @sarakusha/lzma | ^2.3.4 | ES6 wrapper of LZMA-JS |
| lzma | ^2.3.2 | Original LZMA-JS |

---

## See Also

- [PERFORMANCE.md](PERFORMANCE.md) - Detailed performance tracking
- [README.md](readme.md) - Full API documentation
