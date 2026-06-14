import { defineConfig, devices } from '@playwright/test'

// Smoke suite for the host. Host-focused on purpose: it boots only the host dev
// server (the lab/party remotes stay down), so it's fast and stable — and it
// even exercises the resilience path (the live-remote block falling back to its
// offline UI when the lab is unreachable). The federation/presence happy-paths
// would need all three servers running and are left for a later opt-in spec.
export default defineConfig({
  testDir: './tests',
  // Serial, single worker: the host dev server compiles on-demand (Vite +
  // React Compiler), so the first load is slow and parallel workers would all
  // race a cold server. One worker warms it once; the rest run fast.
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  // Generous default timeouts to absorb that cold first compile.
  timeout: 45_000,
  expect: { timeout: 15_000 },
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
})
