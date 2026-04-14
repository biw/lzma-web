import { defineConfig } from 'tsup'

export default defineConfig([
  {
    entry: [
      'src/index.ts',
      'src/sync.ts',
      'src/worker-api.ts',
      'src/lzma_main.ts',
      'src/compress.ts',
      'src/decompress.ts',
      'src/generated/compress-only.ts',
      'src/generated/decompress-only.ts',
    ],
    outDir: 'dist',
    format: ['esm', 'cjs'],
    dts: true,
    sourcemap: true,
    clean: true,
    minify: true,
    splitting: true,
    treeshake: true,
  },
])
