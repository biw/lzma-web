import Worker from 'web-worker'

const action_compress = 1
const action_decompress = 2
const action_progress = 3
const callback_obj = {}

const url = new URL('./worker.js', import.meta.url)
const lzma_worker = new Worker(url)

lzma_worker.onmessage = (e) => {
  if (e.data.action === action_progress) {
    if (
      callback_obj[e.data.cbn] &&
      typeof callback_obj[e.data.cbn].on_progress === 'function'
    ) {
      callback_obj[e.data.cbn].on_progress(e.data.result)
    }
  } else {
    if (
      callback_obj[e.data.cbn] &&
      typeof callback_obj[e.data.cbn].on_finish === 'function'
    ) {
      callback_obj[e.data.cbn].on_finish(e.data.result, e.data.error)

      /// Since the (de)compression is complete, the callbacks are no longer needed.
      delete callback_obj[e.data.cbn]
    }
  }
}

// Very simple error handling.
lzma_worker.onerror = (event) => {
  const err = new Error(`${event.message} (${event.filename}:${event.lineno})`)

  for (var cbn in callback_obj) {
    callback_obj[cbn].on_finish(null, err)
  }

  console.error('Uncaught error in lzma_worker', err)
}

const send_to_worker = (action, data, mode, on_finish, on_progress) => {
  let cbn

  do {
    cbn = Math.floor(Math.random() * 10000000)
  } while (typeof callback_obj[cbn] !== 'undefined')

  callback_obj[cbn] = {
    on_finish: on_finish,
    on_progress: on_progress,
  }

  lzma_worker.postMessage({
    action: action, /// action_compress = 1, action_decompress = 2, action_progress = 3
    cbn: cbn, /// callback number
    data: data,
    mode: mode,
  })
}

export const LZMA = {
  compress: (mixed, mode, on_finish, on_progress) => {
    send_to_worker(action_compress, mixed, mode, on_finish, on_progress)
  },
  decompress: (byte_arr, on_finish, on_progress) => {
    send_to_worker(action_decompress, byte_arr, false, on_finish, on_progress)
  },
  worker: () => {
    return lzma_worker
  },
}
