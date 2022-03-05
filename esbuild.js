import { build } from 'esbuild'

build({
  bundle: true,
  target: ['esnext', 'node16'],
  platform: 'node',
  sourcemap: 'external',
  entryPoints: [
    './src/lzma.js',
    './src/lzma_main.js',
    './src/worker.js',
    './src/index.js',
  ],
  outdir: 'dist',
  minify: true,
})
