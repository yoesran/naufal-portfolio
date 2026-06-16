import { fileURLToPath } from 'node:url'

import { defineConfig } from 'vitest/config'

// Unit tests for the blog's pure lib (no React/DOM needed). The `@` alias mirrors
// tsconfig `paths` so the suites import the same way the app does.
export default defineConfig({
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})
