#!/usr/bin/env node

/**
 * Generate COMPARISON.md from benchmark results
 *
 * This script runs the comparison benchmarks and generates a markdown report.
 *
 * Usage:
 *   node scripts/generate-comparison.js
 *
 * The script will:
 * 1. Run the comparison benchmarks with JSON output
 * 2. Parse the results
 * 3. Generate COMPARISON.md with formatted tables
 */

import { execSync } from 'child_process'
import fs from 'fs'
import path from 'path'
import url from 'url'

const __filename = url.fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const rootDir = path.join(__dirname, '..')

// Run benchmarks and capture output
console.log('Running comparison benchmarks...')
console.log('This may take several minutes.\n')

let benchmarkOutput
try {
  benchmarkOutput = execSync(
    'pnpm test:bench tests/comparison.bench.ts --reporter=verbose 2>&1',
    {
      cwd: rootDir,
      encoding: 'utf-8',
      maxBuffer: 10 * 1024 * 1024, // 10MB buffer
      timeout: 600000, // 10 minutes
    },
  )
} catch (error) {
  // Even if the command "fails", we might have output
  benchmarkOutput = error.stdout || error.message
}

console.log(benchmarkOutput)

// Parse benchmark results from verbose output
// Format: "· name    hz      min      max     mean     ..."
const results = new Map()

const lines = benchmarkOutput.split('\n')
let currentSuite = ''

for (const line of lines) {
  // Match suite headers like "✓ tests/comparison.bench.ts > Library Comparison - Small Text Compression"
  const suiteMatch = line.match(
    /[✓✗] tests\/comparison\.bench\.ts > (.+?)\s+\d+ms/,
  )
  if (suiteMatch) {
    currentSuite = suiteMatch[1]
    if (!results.has(currentSuite)) {
      results.set(currentSuite, [])
    }
    continue
  }

  // Match benchmark results like "· lzma-web sync    76.1127  11.5815  43.3727  13.1384 ..."
  const benchMatch = line.match(
    /^\s*·\s+(.+?)\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)/,
  )
  if (benchMatch && currentSuite) {
    const [, name, hz, min, max, mean] = benchMatch
    results.get(currentSuite).push({
      name: name.trim(),
      hz: parseFloat(hz),
      min: parseFloat(min),
      max: parseFloat(max),
      mean: parseFloat(mean),
    })
  }
}

// Generate compression ratios
console.log('\nCalculating compression ratios...')

import { compressSync } from '../src/sync.js'

const largeTextPath = path.join(rootDir, 'tests/files/large-kjv.txt')
const largeText = fs.existsSync(largeTextPath)
  ? fs.readFileSync(largeTextPath, 'utf-8')
  : 'Sample text '.repeat(10000)

const originalSize = Buffer.byteLength(largeText, 'utf-8')

const ratios = {}

// lzma-web at different modes
for (const mode of [1, 5, 9]) {
  const compressed = compressSync(largeText, mode)
  ratios[`lzma-web (mode ${mode})`] = {
    size: compressed.length,
    ratio: ((compressed.length / originalSize) * 100).toFixed(1),
  }
}

// Generate COMPARISON.md
console.log('\nGenerating COMPARISON.md...')

const markdown = `# LZMA Library Comparison

This document compares lzma-web against other LZMA implementations.

> **Note:** Benchmark results will vary based on your hardware. These results were generated on the machine where the benchmarks were run.

## Quick Summary

### Compression Ratio (4MB text file)

| Library | Compressed Size | Ratio |
|---------|-----------------|-------|
${Object.entries(ratios)
  .map(
    ([name, { size, ratio }]) =>
      `| ${name} | ${(size / 1024).toFixed(0)} KB | ${ratio}% |`,
  )
  .join('\n')}

**Key takeaway:** LZMA mode 5 offers a good balance of speed and compression ratio.

---

## lzma-web Execution Modes

lzma-web provides three execution modes:

| Mode | Entry Point | Description | Best For |
|------|-------------|-------------|----------|
| **Sync** | \`lzma-web/sync\` | Blocking, runs on main thread | Small data, Node.js |
| **Async** | \`lzma-web\` | Promise-based, main thread | General usage |
| **Worker** | \`lzma-web/worker\` | Web Worker (browser only) | Large data, keeping UI responsive |

### Recommendations

- **Small data (<10KB):** Use \`sync\` or \`async\` - worker overhead isn't worth it
- **Large data (>100KB):** Use \`worker\` in browsers to avoid blocking the UI
- **Node.js:** Use \`sync\` for simplicity, \`async\` if you need to handle other events

---

## When to Use Each Library

### Use lzma-web when:

- ✅ You need **browser support**
- ✅ You want a **modern Promise-based API**
- ✅ You need **tree-shaking** for bundle size optimization
- ✅ You're **decompressing pre-compressed data** (fast!)
- ✅ **Compression ratio matters more than speed**

### Use native libraries (@napi-rs/lzma, lzma-native) when:

- ✅ You're in a **Node.js-only environment**
- ✅ You need **maximum compression speed**
- ✅ You're processing **large files server-side**

---

## LZMA Algorithm Characteristics

### Strengths

1. **Best-in-class compression ratio** - 15-30% better than gzip
2. **Fast decompression** - Asymmetric: slow compress, fast decompress
3. **Deterministic output** - Same input always produces same output
4. **Mature format** - Widely supported, well-tested

### Limitations

1. **Slow compression** - 10-100x slower than gzip (especially at high modes)
2. **Memory intensive** - Uses up to 64MB for mode 9
3. **Not streaming** - Must load entire input into memory
4. **Single-threaded** - No built-in parallelism in pure JS implementation

### Compression Modes

| Mode | Memory | Speed | Use Case |
|------|--------|-------|----------|
| 1 | ~1 MB | Fastest | Real-time, large files |
| 5 | ~16 MB | Medium | General purpose |
| 9 | ~64 MB | Slowest | Archival, bandwidth-constrained |

---

## Benchmark Results

The following results were generated by running \`pnpm test:bench tests/comparison.bench.ts\`.

${Array.from(results.entries())
  .map(
    ([suite, benches]) => `### ${suite}

| Library | ops/sec | Mean (ms) |
|---------|---------|-----------|
${benches
  .sort((a, b) => b.hz - a.hz)
  .map((b) => `| ${b.name} | ${b.hz.toFixed(2)} | ${b.mean.toFixed(2)} |`)
  .join('\n')}
`,
  )
  .join('\n')}

---

## Running Benchmarks Yourself

\`\`\`bash
# Run all comparison benchmarks
pnpm test:bench tests/comparison.bench.ts

# Run with detailed output
pnpm test:bench tests/comparison.bench.ts --reporter=verbose
\`\`\`

---

## Library Versions Tested

| Library | Version |
|---------|---------|
| lzma-web | (this package) |
| @napi-rs/lzma | ^1.4.5 |
| lzma-native | ^8.0.6 |
| @sarakusha/lzma | ^2.3.4 |
| lzma | ^2.3.2 |

---

*Generated on ${new Date().toISOString().split('T')[0]}*
`

fs.writeFileSync(path.join(rootDir, 'COMPARISON.md'), markdown)

console.log('\n✅ Generated COMPARISON.md')
console.log(
  `\nCompression ratios for ${(originalSize / 1024).toFixed(0)} KB file:`,
)
for (const [name, { size, ratio }] of Object.entries(ratios)) {
  console.log(`  ${name}: ${ratio}% (${(size / 1024).toFixed(0)} KB)`)
}
