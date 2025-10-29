type CompressMode = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9

interface WorkerMessage {
  action: number
  cbn: number
  result?: any
  error?: Error
}

interface CallbackObject {
  on_finish: (result: any, error: Error | null) => void
  on_progress?: (percentage: number) => void
}

const action_compress = 1
const action_decompress = 2
const action_progress = 3
const callback_obj: Record<number, CallbackObject> = {}

const url = new URL('./worker.js', import.meta.url)
const lzma_worker = new Worker(url)

lzma_worker.onmessage = (e: MessageEvent<WorkerMessage>) => {
  if (e.data.action === action_progress) {
    if (
      callback_obj[e.data.cbn] &&
      typeof callback_obj[e.data.cbn].on_progress === 'function'
    ) {
      callback_obj[e.data.cbn].on_progress!(e.data.result)
    }
  } else {
    if (
      callback_obj[e.data.cbn] &&
      typeof callback_obj[e.data.cbn].on_finish === 'function'
    ) {
      callback_obj[e.data.cbn].on_finish(e.data.result, e.data.error || null)

      /// Since the (de)compression is complete, the callbacks are no longer needed.
      delete callback_obj[e.data.cbn]
    }
  }
}

// Very simple error handling.
lzma_worker.onerror = (event: ErrorEvent) => {
  const err = new Error(`${event.message} (${event.filename}:${event.lineno})`)

  for (const cbn in callback_obj) {
    callback_obj[cbn].on_finish(null, err)
  }

  console.error('Uncaught error in lzma_worker', err)
}

const send_to_worker = (
  action: number,
  data: string | Uint8Array | ArrayBuffer,
  mode: CompressMode | false,
  on_finish: (result: any, error: Error | null) => void,
  on_progress?: (percentage: number) => void,
) => {
  let cbn: number

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
  compress: (
    mixed: string | Uint8Array | ArrayBuffer,
    mode: CompressMode,
    on_finish: (result: Uint8Array | null, error: Error | null) => void,
    on_progress?: (percentage: number) => void,
  ) => {
    send_to_worker(action_compress, mixed, mode, on_finish, on_progress)
  },
  decompress: (
    byte_arr: Uint8Array | ArrayBuffer,
    on_finish: (
      result: string | Uint8Array | null,
      error: Error | null,
    ) => void,
    on_progress?: (percentage: number) => void,
  ) => {
    send_to_worker(action_decompress, byte_arr, false, on_finish, on_progress)
  },
  worker: () => {
    return lzma_worker
  },
}
