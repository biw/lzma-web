import { describe, bench } from 'vitest'
import fs from 'fs'
import path from 'path'
import url from 'url'
import { compress, decompress } from '../src/lzma_main.js'

const __filename = url.fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const pathToFiles = path.join(__dirname, 'files')
const files = fs.readdirSync(pathToFiles)
const compressionModes = [1, 2, 3, 4, 5, 6, 7, 8, 9] as const
const benchmarkGroup = process.env.BENCHMARK_GROUP

const shouldRunGroup = (group: string) =>
  !benchmarkGroup ||
  benchmarkGroup === group ||
  benchmarkGroup === group.replace(/:mode:\d+$/, '')

const compressionModeGroup = (fileName: string, mode: number) =>
  `compress:${fileName}:mode:${mode}`

// Helper to run compression benchmark
const benchCompress = (
  group: string,
  name: string,
  content: string | Buffer,
  mode: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9,
) => {
  bench.skipIf(!shouldRunGroup(group))(
    name,
    async () => {
      await new Promise((resolve) => {
        compress(content, mode, resolve)
      })
    },
    { time: 3000, iterations: 5 },
  )
}

// Helper to run decompression benchmark
const benchDecompress = (group: string, name: string, compressed: Buffer) => {
  bench.skipIf(!shouldRunGroup(group))(
    name,
    async () => {
      await new Promise((resolve) => {
        decompress(compressed, resolve)
      })
    },
    { time: 3000, iterations: 5 },
  )
}

// Error fixtures are correctness cases, not meaningful performance data. They
// remain covered by tests/lzma.test.ts.
const decompressionFiles = files.filter(
  (file) => file.endsWith('.lzma') && !file.startsWith('error-'),
)

// Benchmark all successful decompression operations.
describe('Decompression Performance', () => {
  decompressionFiles.forEach((file) => {
    const compressed = fs.readFileSync(path.join(pathToFiles, file))
    benchDecompress(`decompress:${file}`, `decompress ${file}`, compressed)
  })
})

// Benchmark compression with different modes for key files
describe('Compression Performance - Various Modes', () => {
  const testFiles = [
    'sample_text.txt',
    'chinese.txt',
    'binary',
    'timeseries.txt',
  ]

  testFiles.forEach((fileName) => {
    const filePath = path.join(pathToFiles, fileName)
    if (!fs.existsSync(filePath)) return

    const content = fs.readFileSync(filePath)
    const ext = path.extname(fileName).toLowerCase()
    const data = ext === '.txt' ? content.toString() : content

    describe(fileName, () => {
      // Exercise every public compression mode for each representative input.
      compressionModes.forEach((mode) => {
        benchCompress(
          compressionModeGroup(fileName, mode),
          `compress ${fileName} (mode ${mode})`,
          data,
          mode,
        )
      })
    })
  })
})
