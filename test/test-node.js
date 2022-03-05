import url from 'url'
import fs from 'fs'
import path from 'path'
import {
  announce,
  compare,
  display_result,
  display_time,
  get_hrtime,
  note,
  progress,
} from './utils.js'
import { compress, decompress } from '../src/lzma_main.js'

const __filename = url.fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

let all_tests_pass = true

const decompression_test = (compressed_file, correct_filename, next) => {
  const basename = path.basename(compressed_file)

  note(basename)

  fs.readFile(correct_filename, function (err, correct_result) {
    if (err) {
      console.log('Cannot open ' + correct_filename)
      throw new Error(err)
    }

    fs.readFile(compressed_file, function (err, buffer) {
      let deco_start, deco_speed

      if (err) {
        throw err
      }

      deco_start = get_hrtime()
      decompress(
        buffer,
        function (result, e) {
          if (e) {
            deco_speed = get_hrtime(deco_start)
            if (path.basename(correct_filename) === 'error-' + e.message) {
              display_result('Test passed', true)
              console.log('threw correct error: ' + e.message)
            } else {
              display_result('ERROR: ' + e.message, false)
              all_tests_pass = false
            }
            console.log('Decompression time:', deco_speed + ' ms')
            console.log('')
            return next()
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
            all_tests_pass = false
          }

          console.log('Decompression time:', deco_speed + ' ms')

          console.log('')
          next()
        },
        progress,
      )
    })
  })
}

const decompression_test_sync = (compressed_file, correct_filename, next) => {
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
      all_tests_pass = false
    }
    console.log('Decompression time:', deco_speed + ' ms')
    console.log('')
    return next()
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
    all_tests_pass = false
  }

  console.log('Decompression time:', deco_speed + ' ms')
  console.log('')
  next()
}

const compression_test = (file, next) => {
  const basename = path.basename(file)

  note(basename)

  const ext = path.extname(file).toLowerCase()

  fs.readFile(file, ext === '.txt' ? 'utf8' : null, function (err, content) {
    let comp_start = get_hrtime(),
      compression_mode = 1,
      match,
      buf

    if (err) {
      throw err
    }

    if (typeof content === 'object') {
      buf = new Buffer(content.length)
      content.copy(buf)
    }

    match = path.basename(file, path.extname(file)).match(/^level[ _](\d)/i)

    if (match) {
      compression_mode = Number(match[1]) || 1
    }
    console.log('     Initial size:', content.length + ' bytes')
    compress(
      buf || content,
      compression_mode,
      function ondone(compressed_result) {
        let comp_speed = get_hrtime(comp_start),
          deco_start

        console.log('  Compressed size:', compressed_result.length + ' bytes')

        deco_start = get_hrtime()
        decompress(
          compressed_result,
          function (decompressed_result) {
            const deco_speed = get_hrtime(deco_start)
            console.log(
              'Decompressed size:',
              decompressed_result.length + ' bytes',
            )

            if (typeof decompressed_result === 'string') {
              content = content.toString()
            }

            if (compare(content, decompressed_result)) {
              display_result('Test passed', true)
            } else {
              display_result('ERROR: files do not match!', false)
              all_tests_pass = false
            }

            console.log('  Compression time:', comp_speed + ' ms')
            console.log('Decompression time:', deco_speed + ' ms')

            console.log('')
            next()
          },
          progress,
        )
      },
      progress,
    )
  })
}

const compression_test_sync = (file, next) => {
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
    all_tests_pass = false
  }

  console.log('  Compression time:', comp_speed + ' ms')
  console.log('Decompression time:', deco_speed + ' ms')

  console.log('')
  next()
}

const run_tests = async (test_type) => {
  const path_to_files = path.join(__dirname, 'files')

  announce(`Testing lzma_worker.js ${test_type}`)

  const test_funcs = {
    async: {
      dec: decompression_test,
      com: compression_test,
    },
    sync: {
      dec: decompression_test_sync,
      com: compression_test_sync,
    },
  }

  return new Promise((res) => {
    fs.readdir(path_to_files, (err, files) => {
      if (err) throw err

      const file_count = files.length

      ;(function run_test(i) {
        if (i >= file_count) {
          if (all_tests_pass) {
            display_result('All tests completed successfully', true)
          } else {
            display_result('An error was detected!', false)
          }

          return res(all_tests_pass)
        }
        const file = files[i]

        if (file.slice(-5) === '.lzma') {
          /// Preform a decompress test on *.lzma files.
          test_funcs[test_type].dec(
            path.join(path_to_files, file),
            path.join(path_to_files, file.slice(0, -5)),
            function next() {
              run_test(i + 1)
            },
          )
        } else {
          /// Preform a compression/decompression test.
          test_funcs[test_type].com(
            path.join(path_to_files, file),
            function next() {
              run_test(i + 1)
            },
          )
        }
      })(0)
    })
  })
}

const main = async () => {
  const total_time = get_hrtime()

  const asyncPassed = await run_tests('async')

  if (!asyncPassed) {
    display_time(total_time)
    return process.exit(1)
  }

  const syncPassed = await run_tests('sync')

  if (!syncPassed) {
    display_time(total_time)
    return process.exit(1)
  }
}

main()
