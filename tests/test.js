import url from 'url'
import fs from 'fs'
import path from 'path'
import { compare, display_result, get_hrtime, note } from './utils.js'
import {
  compress as compressCB,
  decompress as decompressCB,
} from '../src/lzma_main.js'

const decompress = async (buffer) =>
  new Promise((res) => {
    decompressCB(buffer, (result, e) => {
      res([result, e])
    })
  })

const compress = async (content, compression_mode) =>
  new Promise((res) => {
    compressCB(content, compression_mode, (result, e) => {
      res([result, e])
    })
  })

const decompression_test = async (compressed_file, correct_filename) => {
  let correct_result = fs.readFileSync(correct_filename)
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

  expect(compare(correct_result, result)).toBe(true)
}

const decompression_test_sync = (compressed_file, correct_filename) => {
  const basename = path.basename(compressed_file)

  note(basename)

  let correct_result = fs.readFileSync(correct_filename)

  const buffer = fs.readFileSync(compressed_file)

  let deco_start, deco_speed

  deco_start = get_hrtime()

  try {
    var result = decompress(buffer)
  } catch (e) {
    deco_speed = get_hrtime(deco_start)
    if (path.basename(correct_filename) === 'error-' + e.message) {
      display_result('Test passed', true)
      console.log('threw correct error: ' + e.message)
    } else {
      display_result('ERROR: ' + e.message, false)
    }
    console.log('Decompression time:', deco_speed + ' ms')
    console.log('')
    return
  }

  deco_speed = get_hrtime(deco_start)

  console.log('Decompressed size:', result.length + ' bytes')

  if (typeof result === 'string') {
    correct_result = correct_result.toString()
  }

  if (compare(correct_result, result)) {
    display_result('Test passed', true)
  } else {
    display_result('ERROR: files do not match!', false)
  }

  console.log('Decompression time:', deco_speed + ' ms')
  console.log('')
}

const compression_test = async (file) => {
  const ext = path.extname(file).toLowerCase()
  let content = fs.readFileSync(file, ext === '.txt' ? 'utf8' : null)

  // let comp_start = get_hrtime()
  let compression_mode = 1
  let match
  let buf

  if (typeof content === 'object') {
    buf = new Buffer(content.length)
    content.copy(buf)
  }

  match = path.basename(file, path.extname(file)).match(/^level[ _](\d)/i)

  if (match) {
    compression_mode = Number(match[1]) || 1
  }

  const [compressed_result] = await compress(buf || content, compression_mode)

  // let comp_speed = get_hrtime(comp_start)
  // const deco_start = get_hrtime()

  const [decompressed_result] = await decompress(compressed_result)

  // const deco_speed = get_hrtime(deco_start)

  if (typeof decompressed_result === 'string') {
    content = content.toString()
  }

  expect(compare(content, decompressed_result)).toBe(true)
}

const compression_test_sync = (file) => {
  const basename = path.basename(file)

  note(basename)

  const ext = path.extname(file).toLowerCase()

  let content = fs.readFileSync(file, ext === '.txt' ? 'utf8' : null)

  let comp_start = get_hrtime(),
    compression_mode = 1,
    match,
    buf

  if (typeof content === 'object') {
    buf = new Buffer(content.length)
    content.copy(buf)
  }

  match = path.basename(file, path.extname(file)).match(/^level[ _](\d)/i)

  if (match) {
    compression_mode = Number(match[1]) || 1
  }
  console.log('     Initial size:', content.length + ' bytes')
  const compressed_result = compress(buf || content, compression_mode)

  let comp_speed = get_hrtime(comp_start),
    deco_start

  console.log('  Compressed size:', compressed_result.length + ' bytes')

  deco_start = get_hrtime()
  const decompressed_result = decompress(compressed_result)

  const deco_speed = get_hrtime(deco_start)
  console.log('Decompressed size:', decompressed_result.length + ' bytes')

  if (typeof decompressed_result === 'string') {
    content = content.toString()
  }

  if (compare(content, decompressed_result)) {
    display_result('Test passed', true)
  } else {
    display_result('ERROR: files do not match!', false)
  }

  console.log('  Compression time:', comp_speed + ' ms')
  console.log('Decompression time:', deco_speed + ' ms')

  console.log('')
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
        // Preform a decompress test on *.lzma files
        await decompression_test(
          path.join(pathToFiles, file),
          path.join(pathToFiles, file.slice(0, -5)),
        )
      })
    } else {
      test(`testing compression/decompress of ${file}`, async () => {
        // Preform a compression/decompress test
        await compression_test(path.join(pathToFiles, file))
      })
    }
  }
})

// describe('Doing sync tests', () => {
//   const path_to_files = path.join(__dirname, 'files')

//   fs.readdir(path_to_files, (err, files) => {
//     if (err) throw err

//     for (let i = 0; i < files.length; i++) {
//       const file = files[i]

//       test(`testing ${file}`, () => {
//         if (file.slice(-5) === '.lzma') {
//           // Preform a decompress test on *.lzma files
//           compression_test_sync(
//             path.join(path_to_files, file),
//             path.join(path_to_files, file.slice(0, -5)),
//           )
//         } else {
//           // Preform a compression test
//           decompression_test_sync(path.join(path_to_files, file))
//         }
//       })
//     }
//   })
// })
