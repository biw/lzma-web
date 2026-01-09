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
    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov', 'json'],
      reportsDirectory: './coverage',
      include: ['src/**/*.ts'],
      exclude: [
        'src/generated/**',
        'src/worker.ts', // Worker entry point
      ],
      // Thresholds (optional - uncomment to enforce)
      // thresholds: {
      //   lines: 80,
      //   functions: 80,
      //   branches: 80,
      //   statements: 80,
      // },
    },
  },
})
