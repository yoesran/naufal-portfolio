import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

const dirname = path.dirname(fileURLToPath(import.meta.url))

// Standalone Vitest config — deliberately NOT the app's vite.config.ts, so the
// Module Federation + React Compiler plugins don't run during unit tests (they'd
// fight the transform and expect a live remote). The suite is pure-function
// checks over the host's own lib; jsdom covers the modules (theme.ts, i18n.ts)
// that touch document/localStorage/matchMedia at import. See src/lib/quality.
export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
  },
  resolve: {
    // Mirror the app's `@` alias so transitive imports (e.g. experience.ts's
    // `@/assets/*.svg?raw`) resolve under Vitest.
    alias: { '@': path.resolve(dirname, './src') },
  },
})
