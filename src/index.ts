import { compress, decompress } from './lzma_main.js'

type Mode = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9

export const LZMA = {
  compress,
  decompress,
}

export default class lzma {
  compress = async (
    input: string | Uint8Array | ArrayBuffer,
    mode: Mode = 9,
  ): Promise<Uint8Array> => {
    return new Promise<Uint8Array>((res, rej) => {
      compress(input, mode, (result, error) => {
        if (result && result instanceof Uint8Array) return res(result)
        if (error) return rej(error)
        rej(new Error('Compression failed'))
      })
    })
  }

  decompress = async (
    input: Uint8Array | ArrayBuffer,
  ): Promise<string | Uint8Array> => {
    return new Promise<string | Uint8Array>((res, rej) => {
      decompress(input, (result, error) => {
        if (result) return res(result)
        if (error) return rej(error)
        rej(new Error('Decompression failed'))
      })
    })
  }

  cb = {
    compress,
    decompress,
  }
}
