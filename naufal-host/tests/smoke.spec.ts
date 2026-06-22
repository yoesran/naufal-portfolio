import { expect, test } from '@playwright/test'

// Host smoke tests — the manual-verify rituals the gotchas prescribe, locked in.
// Run against the host dev server alone (lab/party down); see playwright.config.ts.

test.beforeEach(async ({ page }) => {
  await page.goto('/')
  await expect(
    page.getByRole('heading', { name: 'Naufal Yusran' })
  ).toBeVisible()
})

test('home renders the hero and intro', async ({ page }) => {
  await expect(page).toHaveTitle(/Naufal Yusran/)
  await expect(
    page.getByText('A playground of interactive things I build.')
  ).toBeVisible()
})

test('skip link is the first focusable element and moves focus to main', async ({
  page,
}) => {
  await page.keyboard.press('Tab')
  const skip = page.getByRole('link', { name: 'Skip to content' })
  await expect(skip).toBeFocused()
  await expect(skip).toBeVisible()
  await page.keyboard.press('Enter')
  await expect(page.locator('main#work')).toBeFocused()
})

test('canvas mode toggles on and off', async ({ page }) => {
  await page.getByRole('button', { name: 'Canvas view' }).click()
  await expect(page.getByRole('button', { name: 'Fit to view' })).toBeVisible()
  await page.getByRole('button', { name: 'Exit canvas' }).click()
  await expect(page.getByRole('button', { name: 'Fit to view' })).toHaveCount(0)
})

test('locale switch updates copy and <html lang>', async ({ page }) => {
  await page.getByRole('button', { name: 'ID', exact: true }).click()
  await expect(
    page.getByText('Ruang main berisi hal-hal interaktif yang saya buat.')
  ).toBeVisible()
  await expect(page.locator('html')).toHaveAttribute('lang', 'id')
})

test('theme choice persists across reload', async ({ page }) => {
  await page.getByRole('button', { name: 'Customize theme' }).click()
  await page.getByRole('button', { name: 'dark', exact: true }).click()
  await expect(page.locator('html')).toHaveClass(/dark/)
  await page.reload()
  await expect(page.locator('html')).toHaveClass(/dark/)
})

test('quality cell maps the four apps; a node opens to visit + report', async ({
  page,
}) => {
  await page.locator('#quality').scrollIntoViewIfNeeded()
  // One node per app, named by project + role.
  await expect(
    page.getByRole('button', { name: /host — React host/ })
  ).toBeVisible()
  await expect(
    page.getByRole('button', { name: /naufal-lab — Svelte remote/ })
  ).toBeVisible()
  await expect(
    page.getByRole('button', { name: /naufal-party — PartyKit presence/ })
  ).toBeVisible()
  await expect(
    page.getByRole('button', { name: /naufal-blog — Next.js content/ })
  ).toBeVisible()
  // Opening a node reveals its explanation popover with visit + report links.
  await page.getByRole('button', { name: /naufal-lab — Svelte remote/ }).click()
  await expect(page.getByRole('link', { name: 'visit' })).toBeVisible()
  await expect(
    page.getByRole('link', { name: 'naufal-lab Vitest — open report' })
  ).toBeVisible()
})

test('live-remote falls back to its offline UI when the lab is unreachable', async ({
  page,
}) => {
  // The lab (5174) isn't running in this harness, so Run exercises the MF
  // fallback path rather than a real federated load.
  await page.getByRole('button', { name: 'Run the fetch' }).click()
  await expect(page.getByText('remote not reachable')).toBeVisible({
    timeout: 15_000,
  })
})

test('the ask assistant answers a suggested question', async ({ page }) => {
  // Discoverable from the top: the comprehension-layer CTA launches the chat.
  await expect(page.getByRole('link', { name: /ask about me/i })).toBeVisible()
  await page.locator('#chat').scrollIntoViewIfNeeded()
  // A cold-start chip → a grounded answer naming a real employer.
  await page.getByRole('button', { name: 'Where has he worked?' }).click()
  await expect(page.getByText(/DBS Bank Indonesia/).first()).toBeVisible()

  // A content question retrieves a passage from a post body (not a canned reply).
  const input = page.getByRole('textbox', { name: /ask the assistant/i })
  await input.fill('how does css cross the boundary')
  await input.press('Enter')
  await expect(page.getByRole('link', { name: /read the post/i })).toBeVisible()
})
