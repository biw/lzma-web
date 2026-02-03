import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    testTimeout: 90 * 1000,
    // Only run browser-specific tests (Worker tests)
    include: ['tests/worker.test.ts'],
    browser: {
      enabled: true,
      name: 'chromium',
      provider: 'playwright',
      headless: true,
    },
  },
})
