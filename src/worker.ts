import { compress, decompress } from './lzma_main.js'

const action_compress = 1
const action_decompress = 2

addEventListener('message', (e: MessageEvent) => {
  try {
    if (e.data?.action === action_compress) {
      compress(e.data.data, e.data.mode, e.data.cbn)
    } else if (e.data?.action === action_decompress) {
      decompress(e.data.data, e.data.cbn)
    }
  } catch (error) {
    self.postMessage({
      action: e.data?.action,
      cbn: e.data?.cbn,
      error: error instanceof Error ? error : new Error(String(error)),
    })
  }
})
