import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts', 'src/lzma_main.ts', 'src/worker.ts', 'src/lzma.ts'],
  outDir: 'dist',
  format: ['esm', 'cjs'],
  dts: true,
  sourcemap: true,
  clean: true,
  minify: true,
  splitting: false,
  treeshake: true,
})
