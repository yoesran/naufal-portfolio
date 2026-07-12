import { defineConfig, devices } from '@playwright/test'

// Smoke suite runs against the real production build — same convention as the
// sibling apps. Port 3000 (his call 2026-07-10): collides with
// badriyatim-family's default, but that app is paused — run one at a time.
export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    // The page's real audience is Instagram traffic — phones. The mobile
    // project asserts the touch fixes (wipe pan-y, lightbox close, anchors).
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
  ],
  webServer: {
    // output:'export' has no `next start` — serve the real static artifact,
    // exactly what Cloudflare Pages will serve.
    command: 'npm run build && npx serve out -l 3000',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
})
