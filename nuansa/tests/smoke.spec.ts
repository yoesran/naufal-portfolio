import { type Page, expect, test } from '@playwright/test'

// The product loop: a preset seeds a shell with sections; the section registry
// generates each section's form; the operator composes (reorder / toggle / add /
// remove) and the preview renders the real shell with the real renderers.

function collectErrors(page: Page): string[] {
  const errors: string[] = []
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))
  page.on('pageerror', (e) => errors.push(e.message))
  return errors
}

test('index lists the registered templates', async ({ page }) => {
  const errors = collectErrors(page)
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Nuansa' })).toBeVisible()
  await page.getByRole('link', { name: /Kupu/ }).click()
  await expect(page).toHaveURL(/\/editor\/kupu$/)
  expect(errors).toEqual([])
})

test('kupu preset renders its sections through the paged shell', async ({
  page,
  isMobile,
}) => {
  const errors = collectErrors(page)
  await page.goto('/editor/kupu')
  await expect(page.getByRole('heading', { name: 'Kupu' })).toBeVisible()

  if (!isMobile) {
    await expect(page.getByRole('heading', { name: /Renaldi/ })).toBeVisible()

    const acara = page.getByRole('tab', { name: 'Acara' })
    await acara.click()
    await expect(acara).toHaveAttribute('aria-selected', 'true')

    // Arrow keys move between tabs, per the WAI-ARIA tabs pattern.
    await acara.press('ArrowRight')
    await expect(page.getByRole('tab', { name: 'Lokasi' })).toHaveAttribute(
      'aria-selected',
      'true'
    )
  }
  expect(errors).toEqual([])
})

test('alur preset renders the same sections through the scroll shell', async ({
  page,
  isMobile,
}) => {
  const errors = collectErrors(page)
  await page.goto('/editor/alur')

  if (!isMobile) {
    // Same cover content, a different design: every section is stacked at once,
    // so the couple section repeats the name — scope to the cover's h1.
    await expect(
      page.getByRole('heading', { level: 1, name: /Renaldi/ })
    ).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Mempelai' })).toBeVisible()
    await expect(
      page.getByRole('heading', { name: 'Kirim Hadiah' })
    ).toBeVisible()
    // Nav is anchor links, not tabs.
    await expect(page.getByRole('tab')).toHaveCount(0)
    await expect(page.getByRole('link', { name: /Galeri/ })).toBeVisible()
  }
  expect(errors).toEqual([])
})

// A preset naming a section its shell can't render fails *silently*: the editor
// shows a card for it, the preview drops it. Every section card must therefore
// have a matching nav item.
for (const { template, navItems } of [
  { template: 'kupu', navItems: (p: Page) => p.getByRole('tab') },
  {
    template: 'alur',
    navItems: (p: Page) =>
      p.getByRole('navigation', { name: 'Bagian undangan' }).getByRole('link'),
  },
]) {
  test(`the ${template} preset only lists sections its shell renders`, async ({
    page,
    isMobile,
  }) => {
    test.skip(isMobile, 'preview pane is desktop-only')
    await page.goto(`/editor/${template}`)

    const cards = page.getByRole('button', { name: /^Hapus / })
    await expect(cards.first()).toBeVisible()
    await expect(navItems(page)).toHaveCount(await cards.count())
  })
}

test('the add-section list is exactly what the shell can render', async ({
  page,
}) => {
  // Gallery has no paged renderer, so kupu must neither seed nor offer it...
  await page.goto('/editor/kupu')
  await expect(page.getByRole('button', { name: 'Hapus Galeri' })).toHaveCount(
    0
  )
  await expect(page.getByRole('button', { name: 'Tambah Galeri' })).toHaveCount(
    0
  )
  await expect(
    page.getByRole('button', { name: 'Tambah Sampul' })
  ).toBeVisible()

  // ...while the scroll shell does.
  await page.goto('/editor/alur')
  await expect(
    page.getByRole('button', { name: 'Tambah Galeri' })
  ).toBeVisible()
})

test('operator can edit, reorder, toggle and remove sections', async ({
  page,
  isMobile,
}) => {
  test.skip(isMobile, 'preview pane is desktop-only')
  await page.goto('/editor/kupu')

  // Edit: open the cover section and change a field.
  await page.getByRole('button', { name: 'Sampul', exact: true }).click()
  await page.getByLabel('Nama mempelai pria').fill('Budi')
  await expect(page.getByRole('heading', { name: /Budi/ })).toBeVisible()

  // Reorder: Kutipan starts second; move it up and it leads the nav.
  const tabs = page.getByRole('tab')
  await expect(tabs.first()).toHaveText(/Sampul/)
  await page.getByRole('button', { name: 'Naikkan Kutipan' }).click()
  await expect(tabs.first()).toHaveText(/Kutipan/)

  // Toggle: hiding a section drops its tab.
  await expect(page.getByRole('tab', { name: 'Hitung Mundur' })).toBeVisible()
  await page.getByRole('switch', { name: 'Tampilkan Hitung Mundur' }).click()
  await expect(page.getByRole('tab', { name: 'Hitung Mundur' })).toHaveCount(0)

  // Remove: deleting a section drops it entirely.
  await page.getByRole('button', { name: 'Hapus Penutup' }).click()
  await expect(page.getByRole('tab', { name: 'Penutup' })).toHaveCount(0)
})

test('adding a section appends it to the preview', async ({
  page,
  isMobile,
}) => {
  test.skip(isMobile, 'preview pane is desktop-only')
  await page.goto('/editor/alur')

  const galleryHeadings = page.getByRole('heading', { name: 'Galeri' })
  await expect(galleryHeadings).toHaveCount(1)

  // A site may hold two of the same section kind — keys keep them apart.
  await page.getByRole('button', { name: 'Tambah Galeri' }).click()
  await expect(galleryHeadings).toHaveCount(2)
  // The new card opens itself, so it doesn't look like nothing happened.
  await expect(page.getByRole('button', { name: 'Tambah Foto' })).toBeVisible()
})

test('site-wide settings are generated from a contract too', async ({
  page,
}) => {
  await page.goto('/editor/kupu')
  await expect(page.getByLabel('URL musik (opsional)')).toBeVisible()
})

test('an unknown template 404s', async ({ page }) => {
  const res = await page.goto('/editor/does-not-exist')
  expect(res?.status()).toBe(404)
})
