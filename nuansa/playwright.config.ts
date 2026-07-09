import { defineConfig, devices } from '@playwright/test'

// Smoke suite runs against the real production build — same convention as the
// sibling apps. Port 3005 so it never collides with badriyatim-family's :3000.
export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:3005',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    // The editor collapses to a dialog-based flow on mobile — worth covering.
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
  ],
  webServer: {
    command: 'npm run build && npm run start -- -p 3005',
    url: 'http://localhost:3005',
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
})
