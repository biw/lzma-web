import { compress, decompress } from './lzma_main.js'

var action_compress = 1
var action_decompress = 2

addEventListener('message', (e) => {
  if (e['data']['action'] == action_compress) {
    compress(e.data['data'], e['data']['mode'], e['data']['cbn'])
  } else if (e['data']['action'] == action_decompress) {
    decompress(e['data']['data'], e['data']['cbn'])
  }
})
