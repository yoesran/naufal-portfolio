import { type Page, expect, test } from '@playwright/test'

// The public site's minimum bar: every page renders its heading with a clean
// console, the silsilah is explorable in all three views (the canvas tap broke
// once — pointer capture ate the click — hence the explicit regression tests),
// and the members area stays gated.

function collectErrors(page: Page): string[] {
  const errors: string[] = []
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))
  page.on('pageerror', (e) => errors.push(e.message))
  return errors
}

const pages = [
  { path: '/', heading: 'Badriyatim Family' },
  { path: '/struktur', heading: 'Struktur Organisasi' },
  { path: '/silsilah', heading: 'Silsilah' },
  { path: '/tentang', heading: 'Keluarga Besar Badriyatim & Anizir' },
  { path: '/login', heading: 'Masuk' },
]

for (const p of pages) {
  test(`${p.path} renders with a clean console`, async ({ page }) => {
    const errors = collectErrors(page)
    await page.goto(p.path)
    await expect(
      page.getByRole('heading', { level: 1, name: p.heading })
    ).toBeVisible()
    expect(errors).toEqual([])
  })
}

test('canvas: tapping a node opens its profile (radial)', async ({ page }) => {
  await page.goto('/silsilah')
  // Let the songket threads finish weaving so nodes sit still under the tap.
  await page.waitForTimeout(1800)
  await page.locator('svg [data-node-id]').first().click()
  await expect(page.getByRole('dialog')).toBeVisible()
  await expect(page.getByText('Cikal bakal keluarga (Alm.)')).toBeVisible()
})

test('canvas: a drag pans without opening a profile', async ({ page }) => {
  await page.goto('/silsilah')
  await page.waitForTimeout(1800)
  const box = (await page.locator('.touch-none').first().boundingBox())!
  const node = page.locator('svg [data-node-id]').first()
  const start = (await node.boundingBox())!
  await page.mouse.move(start.x + start.width / 2, start.y + start.height / 2)
  await page.mouse.down()
  await page.mouse.move(box.x + box.width / 2 + 120, box.y + 80, { steps: 8 })
  await page.mouse.up()
  await expect(page.getByRole('dialog')).not.toBeVisible()
})

test('canvas: pinch zooms in around the midpoint', async ({
  page,
  isMobile,
}) => {
  test.skip(!isMobile, 'pinch is a touch gesture')
  await page.goto('/silsilah')
  await page.waitForTimeout(1800)
  const canvas = page.locator('.touch-none')
  // Direct child only — the zoom-button lucide icons are <svg> too.
  const svg = canvas.locator(':scope > svg')
  const scaleOf = (transform: string) =>
    parseFloat(/scale\(([\d.]+)\)/.exec(transform)?.[1] ?? 'NaN')
  const before = scaleOf(await svg.evaluate((el) => el.style.transform))
  const box = (await canvas.boundingBox())!
  const cdp = await page.context().newCDPSession(page)
  await cdp.send('Input.synthesizePinchGesture', {
    x: box.x + box.width / 2,
    y: box.y + box.height / 2,
    scaleFactor: 2,
    relativeSpeed: 400,
  })
  await page.waitForTimeout(300)
  const after = scaleOf(await svg.evaluate((el) => el.style.transform))
  expect(after).toBeGreaterThan(before * 1.2)
})

test('A++ text size also scales the tree’s default zoom', async ({ page }) => {
  await page.goto('/silsilah')
  await page.waitForTimeout(1900)
  const svg = page.locator('.touch-none > svg')
  const scaleOf = (transform: string) =>
    parseFloat(/scale\(([\d.]+)\)/.exec(transform)?.[1] ?? 'NaN')
  const base = scaleOf(await svg.evaluate((el) => el.style.transform))
  // Same effect as the A++ control: the html attribute drives the font size,
  // the rem-based canvas resizes, and the ResizeObserver re-derives the zoom.
  await page.evaluate(() =>
    document.documentElement.setAttribute('data-textsize', 'xl')
  )
  await page.waitForTimeout(500)
  const xl = scaleOf(await svg.evaluate((el) => el.style.transform))
  // xl is 23px/17px ≈ 1.35× — assert well past noise but below the full factor
  // (the height cap can absorb a little of it).
  expect(xl).toBeGreaterThan(base * 1.2)
})

test('canvas: keyboard Enter on a node opens its profile', async ({ page }) => {
  await page.goto('/silsilah')
  await page.waitForTimeout(1800)
  await page.locator('svg [data-node-id]').first().focus()
  await page.keyboard.press('Enter')
  await expect(page.getByRole('dialog')).toBeVisible()
})

test('daftar view: a name opens its profile', async ({ page }) => {
  await page.goto('/silsilah')
  await page.getByRole('button', { name: 'Daftar' }).click()
  await page.getByRole('button', { name: 'Buka semua' }).click()
  await page.locator('li button', { hasText: /cucu/ }).first().click()
  await expect(page.getByRole('dialog')).toBeVisible()
})

test('expired magic link shows an explanation on /login', async ({ page }) => {
  await page.goto('/login?error=tautan')
  // Next's route announcer is also role=alert — pin to the visible message.
  await expect(
    page.getByRole('alert').filter({ hasText: 'Tautan masuk' })
  ).toContainText('kedaluwarsa')
})

test('/keluarga without a session bounces to /login', async ({ page }) => {
  await page.goto('/keluarga')
  await expect(page).toHaveURL(/\/login$/)
  await expect(
    page.getByRole('heading', { level: 1, name: 'Masuk' })
  ).toBeVisible()
})
