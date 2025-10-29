import { describe, test, expect } from 'vitest'
import url from 'url'
import fs from 'fs'
import path from 'path'
import { compare } from './utils.js'
import {
  compress as compressCB,
  decompress as decompressCB,
} from '../src/lzma_main.js'

type CompressMode = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9

const decompress = async (
  buffer: Buffer | Uint8Array,
): Promise<[string | Uint8Array | null, Error | null]> =>
  new Promise((res) => {
    decompressCB(buffer, (result, e) => res([result, e]))
  })

const compress = async (
  content: string | Buffer | Uint8Array,
  compression_mode: CompressMode,
): Promise<[Uint8Array | null, Error | null]> =>
  new Promise((res) => {
    compressCB(content, compression_mode, (result, e) => {
      res([result as Uint8Array | null, e])
    })
  })

const decompression_test = async (
  compressed_file: string,
  correct_filename: string,
) => {
  let correct_result: Buffer | string = fs.readFileSync(correct_filename)
  const buffer = fs.readFileSync(compressed_file)

  const [result, e] = await decompress(buffer)

  // let deco_speed
  // let deco_start = get_hrtime()

  if (e) {
    // deco_speed = get_hrtime(deco_start)
    if (path.basename(correct_filename) === 'error-' + e.message) {
      expect(e).not.toBeNull()
      expect(result).toBeNull()
    } else {
      expect(e).toBeNull()
      expect(result).not.toBeNull()
    }
    return
  }

  // deco_speed = get_hrtime(deco_start)

  if (typeof result === 'string') {
    correct_result = correct_result.toString()
  }

  expect(compare(correct_result, result!)).toBe(true)
}

const compression_test = async (file: string) => {
  const ext = path.extname(file).toLowerCase()
  let content: string | Buffer = fs.readFileSync(
    file,
    ext === '.txt' ? 'utf8' : null,
  ) as string | Buffer

  // let comp_start = get_hrtime()
  let compression_mode = 1
  let match: RegExpMatchArray | null
  let buf: Buffer | undefined

  if (typeof content === 'object') {
    buf = Buffer.from(content)
  }

  match = path.basename(file, path.extname(file)).match(/^level[ _](\d)/i)

  if (match) {
    compression_mode = (Number(match[1]) || 1) as CompressMode
  }

  const [compressed_result] = await compress(
    buf || content,
    compression_mode as CompressMode,
  )

  // let comp_speed = get_hrtime(comp_start)
  // const deco_start = get_hrtime()

  const [decompressed_result] = await decompress(compressed_result!)

  // const deco_speed = get_hrtime(deco_start)

  if (typeof decompressed_result === 'string') {
    content = content.toString()
  }

  expect(compare(content, decompressed_result!)).toBe(true)
}

describe('Doing async tests', () => {
  const __filename = url.fileURLToPath(import.meta.url)
  const __dirname = path.dirname(__filename)

  const pathToFiles = path.join(__dirname, 'files')
  const files = fs.readdirSync(pathToFiles)

  for (let i = 0; i < files.length; i++) {
    const file = files[i]

    if (file.slice(-5) === '.lzma') {
      test(`testing decompression of ${file}`, async () => {
        // Perform a decompress test on *.lzma files
        await decompression_test(
          path.join(pathToFiles, file),
          path.join(pathToFiles, file.slice(0, -5)),
        )
      })
    } else {
      test(`testing compression/decompress of ${file}`, async () => {
        // Perform a compression/decompress test
        await compression_test(path.join(pathToFiles, file))
      })
    }
  }
})
