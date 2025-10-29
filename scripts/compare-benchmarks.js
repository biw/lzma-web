#!/usr/bin/env node

/**
 * Compare benchmark results between main and PR branches
 * Outputs a markdown table with percentage changes
 */

import fs from 'fs'
import path from 'path'

const mainResultsFile = 'main-results.json'
const prResultsFile = 'pr-results.json'
const outputFile = 'benchmark-comparison.md'

// Parse Vitest benchmark JSON output
function parseBenchmarkResults(filePath) {
  if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${filePath}`)
    return null
  }

  const content = fs.readFileSync(filePath, 'utf8')

  // Vitest outputs NDJSON (newline-delimited JSON), so we need to parse each line
  const lines = content.trim().split('\n')
  const benchmarks = new Map()

  for (const line of lines) {
    if (!line.trim()) continue

    try {
      const data = JSON.parse(line)

      // Look for benchmark results in the data
      if (data.type === 'benchmark' && data.benchmark) {
        const { name, result } = data.benchmark
        if (result && result.mean !== undefined) {
          benchmarks.set(name, {
            name,
            hz: result.hz || 1000 / result.mean, // ops/sec
            mean: result.mean, // milliseconds
            min: result.min,
            max: result.max,
            rme: result.rme, // relative margin of error
          })
        }
      }
    } catch (e) {
      // Skip lines that aren't JSON
      continue
    }
  }

  return benchmarks
}

// Calculate percentage change
function percentChange(oldVal, newVal) {
  if (oldVal === 0) return newVal === 0 ? 0 : 100
  return ((newVal - oldVal) / oldVal) * 100
}

// Format percentage with color indicators
function formatChange(change, better) {
  const absChange = Math.abs(change)
  const sign = change >= 0 ? '+' : ''
  const formatted = `${sign}${change.toFixed(2)}%`

  // Determine if change is good or bad
  const isGood = better ? change > 0 : change < 0

  if (absChange < 1) {
    return formatted // No significant change
  } else if (isGood) {
    return `🟢 ${formatted}` // Improvement
  } else {
    return `🔴 ${formatted}` // Regression
  }
}

// Main comparison logic
function compareResults() {
  console.log('Comparing benchmark results...')

  const mainResults = parseBenchmarkResults(mainResultsFile)
  const prResults = parseBenchmarkResults(prResultsFile)

  if (!mainResults || !prResults) {
    console.error('Failed to parse benchmark results')
    return false
  }

  if (mainResults.size === 0 || prResults.size === 0) {
    console.error('No benchmark data found')
    return false
  }

  console.log(`Found ${mainResults.size} benchmarks in main`)
  console.log(`Found ${prResults.size} benchmarks in PR`)

  // Build comparison table
  let markdown = '## 📊 Benchmark Comparison\n\n'
  markdown += `Comparing **${prResults.size}** benchmarks between \`main\` and this PR.\n\n`
  markdown += '### Performance Changes\n\n'
  markdown +=
    '| Benchmark | Main (ops/sec) | PR (ops/sec) | Change | Mean (ms) | Change |\n'
  markdown +=
    '|-----------|----------------|--------------|--------|-----------|--------|\n'

  const changes = []

  // Compare common benchmarks
  for (const [name, prData] of prResults.entries()) {
    const mainData = mainResults.get(name)

    if (!mainData) {
      // New benchmark in PR
      markdown += `| ${name} | - | ${prData.hz.toFixed(2)} | 🆕 New | ${prData.mean.toFixed(2)} | - |\n`
      continue
    }

    const hzChange = percentChange(mainData.hz, prData.hz)
    const meanChange = percentChange(mainData.mean, prData.mean)

    changes.push({ name, hzChange, meanChange })

    markdown += `| ${name} | ${mainData.hz.toFixed(2)} | ${prData.hz.toFixed(2)} | ${formatChange(hzChange, true)} | ${prData.mean.toFixed(2)} | ${formatChange(meanChange, false)} |\n`
  }

  // Check for removed benchmarks
  for (const [name] of mainResults.entries()) {
    if (!prResults.has(name)) {
      markdown += `| ${name} | ${mainResults.get(name).hz.toFixed(2)} | - | ❌ Removed | - | - |\n`
    }
  }

  // Summary statistics
  if (changes.length > 0) {
    const avgHzChange =
      changes.reduce((sum, c) => sum + c.hzChange, 0) / changes.length
    const improvements = changes.filter((c) => c.hzChange > 1).length
    const regressions = changes.filter((c) => c.hzChange < -1).length
    const neutral = changes.length - improvements - regressions

    markdown += '\n### Summary\n\n'
    markdown += `- **Average performance change**: ${formatChange(avgHzChange, true)}\n`
    markdown += `- **Improvements** (>1%): ${improvements}\n`
    markdown += `- **Regressions** (<-1%): ${regressions}\n`
    markdown += `- **Neutral** (±1%): ${neutral}\n`

    if (regressions > 0) {
      markdown +=
        '\n⚠️ **Warning**: Some benchmarks show performance regressions.\n'
    } else if (improvements > regressions) {
      markdown += '\n✅ Overall performance looks good!\n'
    }
  }

  markdown += '\n---\n'
  markdown +=
    '*Benchmarks run with Vitest. Lower mean time and higher ops/sec are better.*\n'

  // Write output
  fs.writeFileSync(outputFile, markdown)
  console.log(`Comparison written to ${outputFile}`)

  return true
}

// Run comparison
const success = compareResults()
process.exit(success ? 0 : 1)
