#!/usr/bin/env node

/**
 * Rebuild consolidated PR benchmark reports from per-mode matrix artifacts.
 *
 * Long-running scenarios are split so their modes can run in parallel. Each
 * mode still benchmarks the PR and main on the same runner; this script joins
 * those independent result pairs back into the same PR-comment sections.
 */

import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

import { compareResults, parseBenchmarkResults } from './compare-benchmarks.js'

const performanceGroups = [
  {
    artifactPrefix: 'compress-timeseries',
    title: 'Compress time-series text at every mode',
    reportName: 'compress-timeseries-benchmark-comparison.md',
  },
]

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'))
}

function modeFromFileName(fileName, artifactPrefix, suffix) {
  const expression = new RegExp(
    `^${artifactPrefix}-mode-(\\d+)-${suffix.replace('.', '\\.')}$`,
  )
  const match = fileName.match(expression)
  return match ? Number(match[1]) : undefined
}

function filesFor(dataDirectory, artifactPrefix, suffix) {
  if (!fs.existsSync(dataDirectory)) return []

  return fs
    .readdirSync(dataDirectory)
    .map((fileName) => ({
      fileName,
      mode: modeFromFileName(fileName, artifactPrefix, suffix),
    }))
    .filter((entry) => entry.mode !== undefined)
    .sort((left, right) => left.mode - right.mode)
    .map(({ fileName, mode }) => ({
      mode,
      filePath: path.join(dataDirectory, fileName),
    }))
}

function resultPairs(dataDirectory, artifactPrefix) {
  const mainByMode = new Map(
    filesFor(dataDirectory, artifactPrefix, 'main-results.json').map(
      (entry) => [entry.mode, entry.filePath],
    ),
  )
  const prByMode = new Map(
    filesFor(dataDirectory, artifactPrefix, 'pr-results.json').map((entry) => [
      entry.mode,
      entry.filePath,
    ]),
  )

  return [...new Set([...mainByMode.keys(), ...prByMode.keys()])]
    .sort((left, right) => left - right)
    .map((mode) => ({
      mode,
      mainPath: mainByMode.get(mode),
      prPath: prByMode.get(mode),
    }))
}

function mergedResults(paths) {
  return {
    files: paths.flatMap((filePath) => readJson(filePath).files || []),
  }
}

function writeSectionReport({ pairs, title, reportPath, createBody }) {
  const missingResult = pairs.find((pair) => !pair.mainPath || !pair.prPath)
  if (missingResult) {
    fs.writeFileSync(
      reportPath,
      `### 📊 ${title}\n\n⚠️ Missing benchmark results for mode ${missingResult.mode}.\n`,
    )
    return
  }

  if (pairs.length === 0) return

  const temporaryDirectory = fs.mkdtempSync(
    path.join(os.tmpdir(), 'lzma-benchmark-merge-'),
  )
  const mainFile = path.join(temporaryDirectory, 'main-results.json')
  const prFile = path.join(temporaryDirectory, 'pr-results.json')
  const bodyFile = path.join(temporaryDirectory, 'benchmark-comparison.md')

  try {
    fs.writeFileSync(
      mainFile,
      JSON.stringify(mergedResults(pairs.map((pair) => pair.mainPath))),
    )
    fs.writeFileSync(
      prFile,
      JSON.stringify(mergedResults(pairs.map((pair) => pair.prPath))),
    )

    const body = createBody({ mainFile, prFile, bodyFile, pairs })
    fs.writeFileSync(reportPath, `### 📊 ${title}\n\n${body}`)
  } finally {
    fs.rmSync(temporaryDirectory, { recursive: true, force: true })
  }
}

function createPerformanceBody({ mainFile, prFile, bodyFile }) {
  if (!compareResults({ mainFile, prFile, reportFile: bodyFile })) {
    return '⚠️ Benchmark comparison could not be generated.\n'
  }

  return fs.readFileSync(bodyFile, 'utf8')
}

function singleBenchmarkMean(filePath) {
  const benchmarks = parseBenchmarkResults(filePath)
  if (!benchmarks || benchmarks.size !== 1) return undefined
  return [...benchmarks.values()][0].mean
}

function formatPercent(value) {
  return `${value.toFixed(4)}%`
}

function formatBytes(value) {
  return `${(value / 1024).toFixed(1)} KiB`
}

function formatPercentagePointChange(mainValue, prValue) {
  const difference = prValue - mainValue
  const sign = difference >= 0 ? '+' : ''
  return `${sign}${difference.toFixed(4)} pp`
}

function formatTimeChange(mainValue, prValue) {
  const difference = ((prValue - mainValue) / mainValue) * 100
  const sign = difference >= 0 ? '+' : ''
  const formatted = `${sign}${difference.toFixed(2)}%`

  if (Math.abs(difference) < 1) return formatted
  return difference < 0 ? `🟢 ${formatted}` : `🔴 ${formatted}`
}

function ratioDataFor(dataDirectory, mode, branch) {
  const filePath = path.join(
    dataDirectory,
    `compression-ratio-mode-${mode}-${branch}-compression-ratio.json`,
  )
  return fs.existsSync(filePath) ? readJson(filePath) : undefined
}

function createRatioBody({ pairs, dataDirectory }) {
  const mainMeans = new Map(
    pairs.map((pair) => [pair.mode, singleBenchmarkMean(pair.mainPath)]),
  )
  const prMeans = new Map(
    pairs.map((pair) => [pair.mode, singleBenchmarkMean(pair.prPath)]),
  )

  const ratioRows = pairs.map((pair) => ({
    mode: pair.mode,
    main: ratioDataFor(dataDirectory, pair.mode, 'main'),
    pr: ratioDataFor(dataDirectory, pair.mode, 'pr'),
    mainMean: mainMeans.get(pair.mode),
    prMean: prMeans.get(pair.mode),
  }))

  const incomplete = ratioRows.find(
    ({ main, pr, mainMean, prMean }) => !main || !pr || !mainMean || !prMean,
  )
  if (incomplete) {
    return `⚠️ Compression-ratio data could not be generated for mode ${incomplete.mode}.\n`
  }

  let body = `Comparing **${ratioRows.length}** compression-ratio benchmarks between \`main\` and this PR.\n\n`
  body +=
    '<details>\n<summary><strong>Compression-ratio changes</strong></summary>\n\n'
  body +=
    '| Mode | Main compressed size | PR compressed size | Main ratio | PR ratio | Ratio change | Main time (ms) | PR time (ms) | Time change |\n'
  body +=
    '|------|----------------------|--------------------|------------|----------|--------------|----------------|--------------|-------------|\n'

  for (const { mode, main, pr, mainMean, prMean } of ratioRows) {
    body += `| ${mode} | ${formatBytes(main.compressedBytes)} | ${formatBytes(pr.compressedBytes)} | ${formatPercent(main.ratioPercent)} | ${formatPercent(pr.ratioPercent)} | ${formatPercentagePointChange(main.ratioPercent, pr.ratioPercent)} | ${mainMean.toFixed(2)} | ${prMean.toFixed(2)} | ${formatTimeChange(mainMean, prMean)} |\n`
  }

  body +=
    '\n</details>\n\n*Ratios are deterministic and each mode is compressed once per revision. Compression-ratio change is measured in percentage points; lower is better.*\n'
  return body
}

export function mergeSplitBenchmarkReports({
  dataDirectory,
  reportsDirectory,
}) {
  fs.mkdirSync(reportsDirectory, { recursive: true })
  const reports = []

  for (const group of performanceGroups) {
    const pairs = resultPairs(dataDirectory, group.artifactPrefix)
    if (pairs.length === 0) continue

    const reportPath = path.join(reportsDirectory, group.reportName)
    writeSectionReport({
      pairs,
      title: group.title,
      reportPath,
      createBody: createPerformanceBody,
    })
    reports.push(reportPath)
  }

  const ratioPairs = resultPairs(dataDirectory, 'compression-ratio')
  if (ratioPairs.length > 0) {
    const reportPath = path.join(
      reportsDirectory,
      'compression-ratio-benchmark-comparison.md',
    )
    writeSectionReport({
      pairs: ratioPairs,
      title: 'Compression-ratio report',
      reportPath,
      createBody: ({ pairs }) => createRatioBody({ pairs, dataDirectory }),
    })
    reports.push(reportPath)
  }

  return reports
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const [
    dataDirectory = 'benchmark-data',
    reportsDirectory = 'benchmark-reports',
  ] = process.argv.slice(2)
  const reports = mergeSplitBenchmarkReports({
    dataDirectory,
    reportsDirectory,
  })
  console.log(`Generated ${reports.length} consolidated benchmark report(s).`)
}
