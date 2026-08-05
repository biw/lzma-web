import { createWorkerLZMA } from 'lzma-web/worker'

async function run() {
  const lzma = createWorkerLZMA()

  try {
    const input = 'electron renderer Worker smoke test'
    const compressed = await lzma.compress(input, 1)
    const decompressed = await lzma.decompress(compressed)

    if (decompressed !== input) {
      throw new Error(`roundtrip failed: ${String(decompressed)}`)
    }
  } finally {
    lzma.terminate()
  }
}

run().then(
  () => console.log('RENDERER_SMOKE_OK'),
  (error) => {
    const message = error instanceof Error ? error.stack ?? error.message : String(error)
    console.error(`RENDERER_SMOKE_FAIL ${message}`)
  },
)
