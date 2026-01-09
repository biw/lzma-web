import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    testTimeout: 90 * 1000,
    // Include all test files (*.test.ts and *.spec.ts), exclude benchmarks by default
    include: ['tests/**/*.{test,spec}.ts'],
    // Benchmark files use *.bench.ts pattern (run with yarn test:bench)
    benchmark: {
      include: ['tests/**/*.bench.ts'],
    },
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true,
      },
    },
    // Show detailed timing for each test
    reporters: ['default'],
    // Optionally output to JSON for tracking
    outputFile: {
      json: './test-results.json',
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'json-summary', 'html'],
      include: ['src/**/*.ts'],
    },
  },
})
