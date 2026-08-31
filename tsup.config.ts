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
    // TypeScript 7 no longer exposes the compiler API used by tsup's bundled
    // declaration plugin. Declarations are emitted by tsc after this build.
    dts: false,
    sourcemap: true,
    clean: true,
    minify: true,
    splitting: true,
    treeshake: true,
  },
])
