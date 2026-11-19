import { defineConfig } from 'vitest/config'

// Core logic is pure, so tests run in plain Node (no jsdom): any browser global that leaks into
// src/core throws immediately.
export default defineConfig({
  test: { environment: 'node', include: ['tests/**/*.test.ts'] },
})
