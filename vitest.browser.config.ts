import { defineConfig } from 'vitest/config'

export default defineConfig({
  optimizeDeps: {
    // Resolve this from the browser consumer fixture instead of pre-bundling
    // the package self-reference from this repository.
    exclude: [
      'lzma-web',
      'lzma-web/sync',
      'lzma-web/worker',
      'lzma-web/compress',
      'lzma-web/decompress',
    ],
  },
  test: {
    testTimeout: 90 * 1000,
    // Run Worker behavior tests and the packed browser consumer fixture.
    include: [
      'tests/worker.test.ts',
      'tests/fixtures/browser-consumer/entry-points-consumer.test.mjs',
    ],
    globalSetup: ['tests/browser-consumer.setup.ts'],
    browser: {
      enabled: true,
      name: 'chromium',
      provider: 'playwright',
      headless: true,
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov', 'json-summary'],
      reportsDirectory: './coverage/browser',
      include: ['src/worker-api.ts'],
      exclude: ['src/generated/**', 'src/worker-thread.ts'],
      thresholds: {
        statements: 95,
        branches: 85,
        functions: 100,
        lines: 95,
      },
    },
  },
})
