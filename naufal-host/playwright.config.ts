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
    // Video + full trace are heavy, so they're opt-in via PW_MEDIA — the reports
    // pipeline (npm run reports) sets it to capture the recordings embedded in the
    // published HTML report; a normal `npm run test:e2e` stays light.
    trace: process.env.PW_MEDIA ? 'on' : 'on-first-retry',
    video: process.env.PW_MEDIA ? 'on' : 'off',
    // Watch the run drive the browser: `npm run test:e2e:headed` (real window)
    // or `npm run test:e2e:ui` (Playwright's UI, step-through + live pane). To
    // slow the actions down so they're easy to follow, set PW_SLOWMO (ms per
    // action), e.g. `PW_SLOWMO=600 npm run test:e2e:headed`. 0 (default) adds no
    // delay, so this knob never affects a normal run.
    launchOptions: { slowMo: Number(process.env.PW_SLOWMO) || 0 },
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
})
