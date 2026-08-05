import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

import { compareResults } from '../scripts/compare-benchmarks.js'

describe('compareResults', () => {
  it('retains benchmarks with the same name from different suites', async () => {
    const directory = await mkdtemp(path.join(os.tmpdir(), 'lzma-benchmarks-'))
    const mainFile = path.join(directory, 'main-results.json')
    const prFile = path.join(directory, 'pr-results.json')
    const reportFile = path.join(directory, 'comparison.md')

    const results = (smallMean: number, largeMean: number) => ({
      files: [
        {
          filepath: 'tests/comparison.bench.ts',
          groups: [
            {
              fullName: 'Small text compression',
              benchmarks: [
                { name: 'lzma-web (sync)', hz: 1000, mean: smallMean },
                { name: 'incomplete native benchmark', hz: 0 },
              ],
            },
            {
              fullName: 'Large text compression',
              benchmarks: [
                { name: 'lzma-web (sync)', hz: 10, mean: largeMean },
              ],
            },
          ],
        },
      ],
    })

    try {
      await writeFile(mainFile, JSON.stringify(results(1, 100)))
      await writeFile(prFile, JSON.stringify(results(2, 200)))

      expect(compareResults({ mainFile, prFile, reportFile })).toBe(true)

      const report = await readFile(reportFile, 'utf8')
      expect(report).toContain('Comparing **2** benchmarks')
      expect(report).toContain('<details>')
      expect(report).toContain('</details>')
      expect(report).toContain('| Benchmark | Main (ms) | PR (ms) | Change |')
      expect(report).not.toContain('| File | Suite |')
      expect(report).toContain(
        '| lzma-web (sync) | 1.00 | 2.00 | 🔴 +100.00% |',
      )
      expect(report).toContain(
        '| lzma-web (sync) | 100.00 | 200.00 | 🔴 +100.00% |',
      )
      expect(report).not.toContain('incomplete native benchmark')
      expect(report).toContain('- **Slower** (>1%): 2')
      expect(report).not.toContain('**Faster**')
      expect(report).not.toContain('**Unchanged**')
    } finally {
      await rm(directory, { recursive: true, force: true })
    }
  })
})
