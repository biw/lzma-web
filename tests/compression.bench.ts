import { describe, bench } from 'vitest'
import fs from 'fs'
import path from 'path'
import url from 'url'
import { compress, decompress } from '../src/lzma_main.js'

const __filename = url.fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const pathToFiles = path.join(__dirname, 'files')
const files = fs.readdirSync(pathToFiles)

// Helper to run compression benchmark
const benchCompress = (
  name: string,
  content: string | Buffer,
  mode: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9,
) => {
  bench(
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
const benchDecompress = (name: string, compressed: Buffer) => {
  bench(
    name,
    async () => {
      await new Promise((resolve) => {
        decompress(compressed, resolve)
      })
    },
    { time: 3000, iterations: 5 },
  )
}

// Benchmark all decompression operations
describe('Decompression Performance', () => {
  files
    .filter((file) => file.endsWith('.lzma'))
    .forEach((file) => {
      const compressed = fs.readFileSync(path.join(pathToFiles, file))
      benchDecompress(`decompress ${file}`, compressed)
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
      // Test different compression modes
      ;[1, 5, 9].forEach((mode) => {
        benchCompress(
          `compress ${fileName} (mode ${mode})`,
          data,
          mode as 1 | 5 | 9,
        )
      })
    })
  })
})

// Benchmark files with their designated compression levels
describe('Compression Performance - Level Files', () => {
  const levelFiles = files.filter((f) => f.match(/^level[_ ]\d$/i))

  levelFiles.forEach((file) => {
    const filePath = path.join(pathToFiles, file)
    const content = fs.readFileSync(filePath)
    const match = file.match(/^level[_ ](\d)/i)
    const level = match
      ? (Number(match[1]) as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9)
      : 1

    benchCompress(`compress ${file} (mode ${level})`, content, level)
  })
})
