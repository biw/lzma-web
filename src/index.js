//! © 2015 Nathan Rugg <nmrugg@gmail.com> | MIT
import { compress, decompress } from './lzma_main.js'

export const LZMA = {
  compress,
  decompress,
}

export default class lzma {
  compress = async (input, mode = 9) => {
    return new Promise((res, rej) => {
      compress(input, mode, (result, error) => {
        if (result) return res(result)
        rej(error)
      })
    })
  }
  decompress = async (input) => {
    return new Promise((res, rej) => {
      decompress(input, (result, error) => {
        if (result) return res(result)
        rej(error)
      })
    })
  }
  // eslint-disable-next-line no-undef
  cb = {
    compress,
    decompress,
  }
}
