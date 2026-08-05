import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

import { mergeSplitBenchmarkReports } from '../scripts/merge-split-benchmark-reports.js'

const benchmarkResults = (name: string, mean: number) => ({
  files: [
    {
      filepath: 'tests/compression.bench.ts',
      groups: [
        {
          fullName: 'Compression Performance - Various Modes > timeseries.txt',
          benchmarks: [{ name, hz: 1, mean }],
        },
      ],
    },
  ],
})

const ratioResults = (mode: number, mean: number) => ({
  files: [
    {
      filepath: 'tests/comparison.bench.ts',
      groups: [
        {
          fullName: 'LZMA Compression Ratio by Mode',
          benchmarks: [
            {
              name: `Calculate compression ratio (mode ${mode})`,
              hz: 1,
              mean,
            },
          ],
        },
      ],
    },
  ],
})

describe('mergeSplitBenchmarkReports', () => {
  it('combines per-mode timing and ratio artifacts into the PR report sections', async () => {
    const directory = await mkdtemp(path.join(os.tmpdir(), 'lzma-benchmark-'))
    const dataDirectory = path.join(directory, 'data')
    const reportsDirectory = path.join(directory, 'reports')

    try {
      await mkdir(dataDirectory)

      for (const mode of [1, 9]) {
        await writeFile(
          path.join(
            dataDirectory,
            `compress-timeseries-mode-${mode}-main-results.json`,
          ),
          JSON.stringify(
            benchmarkResults(
              `compress timeseries.txt (mode ${mode})`,
              mode * 10,
            ),
          ),
        )
        await writeFile(
          path.join(
            dataDirectory,
            `compress-timeseries-mode-${mode}-pr-results.json`,
          ),
          JSON.stringify(
            benchmarkResults(
              `compress timeseries.txt (mode ${mode})`,
              mode * 20,
            ),
          ),
        )
      }

      for (const mode of [1, 5, 9]) {
        await writeFile(
          path.join(
            dataDirectory,
            `compression-ratio-mode-${mode}-main-results.json`,
          ),
          JSON.stringify(ratioResults(mode, mode * 100)),
        )
        await writeFile(
          path.join(
            dataDirectory,
            `compression-ratio-mode-${mode}-pr-results.json`,
          ),
          JSON.stringify(ratioResults(mode, mode * 110)),
        )
        await writeFile(
          path.join(
            dataDirectory,
            `compression-ratio-mode-${mode}-main-compression-ratio.json`,
          ),
          JSON.stringify({
            mode,
            originalBytes: 10_000,
            compressedBytes: mode * 100,
            ratioPercent: mode,
          }),
        )
        await writeFile(
          path.join(
            dataDirectory,
            `compression-ratio-mode-${mode}-pr-compression-ratio.json`,
          ),
          JSON.stringify({
            mode,
            originalBytes: 10_000,
            compressedBytes: mode * 110,
            ratioPercent: mode * 1.1,
          }),
        )
      }

      const reports = mergeSplitBenchmarkReports({
        dataDirectory,
        reportsDirectory,
      })

      expect(reports).toHaveLength(2)

      const timeSeriesReport = await readFile(
        path.join(
          reportsDirectory,
          'compress-timeseries-benchmark-comparison.md',
        ),
        'utf8',
      )
      expect(timeSeriesReport).toContain(
        '### 📊 Compress time-series text at every mode',
      )
      expect(timeSeriesReport).toContain('Comparing **2** benchmarks')
      expect(timeSeriesReport).toContain('compress timeseries.txt (mode 1)')
      expect(timeSeriesReport).toContain('compress timeseries.txt (mode 9)')

      const ratioReport = await readFile(
        path.join(
          reportsDirectory,
          'compression-ratio-benchmark-comparison.md',
        ),
        'utf8',
      )
      expect(ratioReport).toContain('### 📊 Compression-ratio report')
      expect(ratioReport).toContain(
        'Comparing **3** compression-ratio benchmarks',
      )
      expect(ratioReport).toContain(
        '| 5 | 0.5 KiB | 0.5 KiB | 5.0000% | 5.5000% | +0.5000 pp |',
      )
      expect(ratioReport).toContain(
        '*Ratios are deterministic and each mode is compressed once per revision. Compression-ratio change is measured in percentage points; lower is better.*',
      )
    } finally {
      await rm(directory, { recursive: true, force: true })
    }
  })
})
