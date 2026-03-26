#!/usr/bin/env node

/**
 * Simple test performance tracker
 * Runs tests and logs timing data to a CSV file
 */

import { execSync } from 'child_process'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const perfFile = path.join(__dirname, '..', 'test-performance.csv')

// Initialize CSV file if it doesn't exist
if (!fs.existsSync(perfFile)) {
  fs.writeFileSync(
    perfFile,
    'timestamp,duration_ms,benchmarks_run,avg_ops_per_sec,git_commit\n',
  )
}

console.log('🏃 Running benchmarks and tracking performance...\n')

const startTime = Date.now()
let output = ''
let exitCode = 0

try {
  // Run benchmarks with default reporter
  // Capture both stdout and stderr since Vitest outputs to both
  output = execSync('yarn test:bench 2>&1', {
    encoding: 'utf-8',
  })
} catch (error) {
  output = error.stdout || error.stderr || ''
  exitCode = error.status || 0
}

const endTime = Date.now()
const duration = endTime - startTime

// Parse benchmark results from Vitest output
let benchmarksRun = 0
let avgHz = 0

try {
  // Parse the table output from Vitest
  const lines = output.split('\n')
  const benchmarks = []

  for (const line of lines) {
    // Look for benchmark result lines with "·" prefix and hz values
    // Format: · benchmark name     123.45    1.23    4.56    2.34    ...
    const benchMatch = line.match(/^\s*·\s+(.+?)\s+([\d,]+\.\d{2})\s+/)
    if (benchMatch) {
      const hz = parseFloat(benchMatch[2].replace(/,/g, ''))
      if (!isNaN(hz) && hz > 0) {
        benchmarks.push({ hz })
      }
    }
  }

  if (benchmarks.length > 0) {
    benchmarksRun = benchmarks.length
    avgHz = benchmarks.reduce((sum, b) => sum + b.hz, 0) / benchmarks.length
  }

  // If we didn't find benchmarks in the table, try counting from summary
  if (benchmarksRun === 0) {
    // Look for test suite summary like "✓ tests/compression.bench.ts > Decompression Performance (18)"
    const suiteMatches = output.matchAll(/✓.*?\((\d+)\)/g)
    for (const match of suiteMatches) {
      benchmarksRun += parseInt(match[1])
    }
  }
} catch (e) {
  console.error('Error parsing benchmark results:', e.message)
}

// Get current git commit
let gitCommit = 'unknown'
try {
  gitCommit = execSync('git rev-parse --short HEAD', {
    encoding: 'utf-8',
  }).trim()
} catch (e) {
  // Not in a git repo or git not available
}

// Append results to CSV
const timestamp = new Date().toISOString()
const csvLine = `${timestamp},${duration},${benchmarksRun},${avgHz.toFixed(2)},${gitCommit}\n`
fs.appendFileSync(perfFile, csvLine)

console.log('\n📊 Performance tracked:')
console.log(`   Duration: ${duration}ms (${(duration / 1000).toFixed(2)}s)`)
console.log(`   Benchmarks: ${benchmarksRun} ran`)
console.log(`   Avg ops/sec: ${avgHz.toFixed(2)}`)
console.log(`   Commit: ${gitCommit}`)
console.log(`   Log: ${perfFile}`)

// Show recent history
const lines = fs
  .readFileSync(perfFile, 'utf-8')
  .split('\n')
  .filter((l) => l.trim())
if (lines.length > 1) {
  console.log('\n📈 Recent runs:')
  lines.slice(-5).forEach((line) => {
    const [ts, dur, benchmarks, avgOps, commit] = line.split(',')
    if (dur !== 'duration_ms') {
      const date = new Date(ts)
      console.log(
        `   ${date.toLocaleTimeString()} - ${dur}ms (${benchmarks} benchmarks, ${avgOps} avg ops/sec) [${commit}]`,
      )
    }
  })
}

process.exit(exitCode)
