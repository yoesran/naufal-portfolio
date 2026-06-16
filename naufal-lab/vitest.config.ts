import path from 'node:path'

import { svelte } from '@sveltejs/vite-plugin-svelte'
import { defineConfig } from 'vitest/config'

// Vitest setup for the Svelte remote. The `browser` resolve condition pulls in
// Svelte's client runtime so `mount()` works under jsdom; the `$lib` alias and
// the svelte plugin mirror vite.config.ts so components compile the same way.
export default defineConfig({
  plugins: [svelte()],
  resolve: {
    alias: { $lib: path.resolve('./src/lib') },
    conditions: ['browser'],
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/vitest.setup.ts'],
    include: ['src/**/*.test.ts'],
  },
})
