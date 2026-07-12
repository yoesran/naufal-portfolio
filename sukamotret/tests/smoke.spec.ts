import { type Page, expect, test } from '@playwright/test'

// Console errors fail the suite — the page must boot clean.
async function gotoClean(page: Page) {
  const errors: string[] = []
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))
  page.on('pageerror', (e) => errors.push(String(e)))
  await page.goto('/')
  // sun facts arrive in a mount effect; until then the hero shows "—" and the
  // sky arc isn't drawn. A real time in the golden-hour hero means we're live.
  await expect(page.locator('.golden-range')).not.toHaveText('—')
  return errors
}

test('renders every section without console errors', async ({ page }) => {
  const errors = await gotoClean(page)
  await expect(
    page.getByRole('heading', { name: /turning moments/i })
  ).toBeVisible()
  for (const id of [
    'cahaya',
    'karya',
    'coba',
    'editfoto',
    'pose',
    'sesi',
    'studio',
  ]) {
    await expect(page.locator(`#${id}`)).toBeAttached()
  }
  expect(errors).toEqual([])
})

test('light bar shows plausible Tabalong sun times', async ({ page }) => {
  await gotoClean(page)
  // Near the equator these barely move all year — a real runtime invariant,
  // not a snapshot: sunrise ~06:xx, sunset band 17–18:xx WITA. Read from the
  // sky-arc caption + the golden-hour hero (the old 5-cell grid is gone).
  await expect(page.locator('.arc-rise')).toHaveText(/terbit 0[56]\.\d{2}/)
  await expect(page.locator('.arc-set')).toHaveText(/terbenam 1[78]\.\d{2}/)
  await expect(page.locator('.golden-range')).toHaveText(
    /^1[78]\.\d{2}–1[78]\.\d{2}$/
  )
  // the .ics reminder unlocks once sun facts exist
  await expect(
    page.getByRole('button', { name: '🔔 Ingatkan aku' })
  ).toBeEnabled()
})

test('scrubber clock agrees with the light bar to the minute', async ({
  page,
}) => {
  await gotoClean(page)
  // both read today's golden-hour start; a formatter (or range-step)
  // regression shows up as a one-minute disagreement here
  const golden = await page.locator('.golden-range').textContent()
  await expect(page.locator('.clock')).toHaveText(golden!.split('–')[0])
})

test('simulator verdict follows the scrubbed hour', async ({ page }) => {
  await gotoClean(page)
  const verdict = page.locator('#coba .verdict')
  await expect(verdict).toContainText('Golden hour.')
  await page.locator('#coba input[type="range"]').fill('720') // 12.00
  await expect(verdict).toContainText('Matahari tepat di atas kepala.')
  await expect(page.locator('#coba .clock')).toHaveText('12.00')
})

test('the page opens already lit — the hero never changes colour', async ({
  page,
}) => {
  // Sample the hero word AND the page tint from the very first frame. Before
  // the boot script existed, the hero painted amber for ~1.1s then faded to
  // blue at midday — the "jump".
  //
  // One distinct sample proves BOTH things at once: that the phase was known
  // before paint (no flash), and that the boot script's maths agrees with
  // lib/sun.ts (the drift guard) — because any disagreement would make React's
  // effect rewrite data-phase, and every phase has a distinct accent or tint.
  await page.addInitScript(() => {
    const w = window as unknown as { __seen: Set<string> }
    w.__seen = new Set()
    const tick = () => {
      const em = document.querySelector('h1 em')
      if (em)
        w.__seen.add(
          getComputedStyle(em).color +
            '|' +
            getComputedStyle(document.body).backgroundColor
        )
      if (performance.now() < 1500) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  })
  await gotoClean(page)
  await page.waitForTimeout(1700)

  const { seen, phase } = await page.evaluate(() => ({
    seen: [...(window as unknown as { __seen: Set<string> }).__seen],
    phase: document.documentElement.dataset.phase,
  }))
  expect(seen).toHaveLength(1)
  expect(['golden', 'day', 'blue', 'night']).toContain(phase)
})

test('the scrubber relights the page; look presets do not', async ({
  page,
}) => {
  await gotoClean(page)
  const phase = () =>
    page.evaluate(() => document.documentElement.dataset.phase)
  const amber = () =>
    page.evaluate(() =>
      getComputedStyle(document.documentElement)
        .getPropertyValue('--amber')
        .trim()
    )
  const fixed = await amber()
  const hour = page.getByLabel('Jam pemotretan')

  // scrub to midday → the page is lit for 'day'; to golden hour → 'golden'
  await hour.fill('720')
  await expect.poll(phase).toBe('day')
  await hour.fill('1080') // 18.00, inside golden hour
  await expect.poll(phase).toBe('golden')
  await expect(page.locator('h1 em')).toHaveCSS('color', 'rgb(176, 111, 23)')
  await hour.fill('1140') // 19.00, past dusk
  await expect.poll(phase).toBe('night')

  // a LOOK is a grade, not a time — it must never relight the page
  await page.locator('#coba').getByRole('button', { name: 'Hangat' }).click()
  await expect.poll(phase).toBe('night')

  // and the SEMANTIC colours never move, whatever the phase
  expect(await amber()).toBe(fixed)
  await expect(page.locator('.golden-range')).toHaveCSS(
    'color',
    'rgb(176, 111, 23)'
  )
})

test('contact sheet filters and the lightbox closes by its button', async ({
  page,
}) => {
  await gotoClean(page)
  // scope to #karya — the pose guide also has a 'Wisuda' filter chip
  await page
    .locator('#karya')
    .getByRole('button', { name: 'Wisuda', exact: true })
    .click()
  const frames = page.locator('.frame')
  await expect(frames.first()).toBeVisible()
  for (const cat of await frames.locator('.cat').allTextContents()) {
    expect(cat).toBe('wisuda')
  }
  await frames.first().click()
  const lb = page.locator('dialog.lb')
  await expect(lb).toHaveJSProperty('open', true)
  // a visible close button — phones have no Esc
  await page.getByRole('button', { name: 'Tutup pratinjau' }).click()
  await expect(lb).toHaveJSProperty('open', false)
})

test('lightbox keeps a constant width across images (no UI jump)', async ({
  page,
}) => {
  await gotoClean(page)
  await page.locator('.frame').first().click()
  const widthOf = () =>
    page.$eval('dialog.lb', (d) => d.getBoundingClientRect().width)
  const w1 = await widthOf()
  await page.getByRole('button', { name: 'Foto berikutnya' }).click()
  const w2 = await widthOf()
  await page.getByRole('button', { name: 'Foto berikutnya' }).click()
  const w3 = await widthOf()
  // a <dialog> is fit-content by default — without an explicit width it
  // resizes to each caption and the popup jumps between images
  expect(w2).toBe(w1)
  expect(w3).toBe(w1)
  await page.getByRole('button', { name: 'Tutup pratinjau' }).click()
})

test('photo editor: wipe tracks input, look syncs into the simulator', async ({
  page,
}) => {
  await gotoClean(page)
  // by name: the editor has two sliders now (wipe + look intensity)
  await page.getByLabel('Posisi pembanding sebelum-sesudah').fill('25')
  await expect(page.locator('#editfoto .top')).toHaveCSS(
    'clip-path',
    'inset(0px 0px 0px 25%)'
  )
  // choosing a look in the editor must select it everywhere (shared state)
  await page
    .locator('#editfoto')
    .getByRole('button', { name: 'Blue Hour' })
    .click()
  await expect(
    page.locator('#coba').getByRole('button', { name: 'Blue Hour' })
  ).toHaveAttribute('aria-pressed', 'true')
  await expect(page.locator('#coba .stamp')).toContainText('Blue Hour')
  // dialling the look down rides into the WhatsApp brief
  await page.getByLabel('Intensitas look').fill('60')
  await expect(page.locator('.msg')).toContainText('Blue Hour (60%)')
})

test('photo editor accepts an upload and never distorts it', async ({
  page,
}) => {
  await gotoClean(page)
  await expect(page.locator('#editfoto .stamp')).toContainText('contoh')
  // synthesize a PORTRAIT JPEG in-page — the shape most phone photos arrive
  // in, and the one a fixed-aspect canvas box would stretch
  await page.evaluate(async () => {
    const c = document.createElement('canvas')
    c.width = 900
    c.height = 1600
    const g = c.getContext('2d')!
    g.fillStyle = '#caa07a'
    g.fillRect(0, 0, 900, 1600)
    const blob: Blob = await new Promise((r) =>
      c.toBlob((b) => r(b!), 'image/jpeg', 0.9)
    )
    const dt = new DataTransfer()
    dt.items.add(new File([blob], 'test.jpg', { type: 'image/jpeg' }))
    const input = document.querySelector<HTMLInputElement>(
      '#editfoto input[type="file"]'
    )!
    input.files = dt.files
    input.dispatchEvent(new Event('change', { bubbles: true }))
  })
  await expect(page.locator('#editfoto .stamp')).toContainText('fotomu')
  // rendered box must not be taller than the cap, and the drawn photo keeps
  // its ratio (object-contain letterboxes rather than stretches)
  const geo = await page.evaluate(() => {
    const base = document.querySelector<HTMLCanvasElement>('#editfoto canvas')!
    const box = base.getBoundingClientRect()
    return {
      intrinsic: base.width / base.height,
      boxH: box.height,
      viewH: window.innerHeight,
      objectFit: getComputedStyle(base).objectFit,
    }
  })
  expect(geo.intrinsic).toBeCloseTo(900 / 1600, 2)
  expect(geo.objectFit).toBe('contain')
  expect(geo.boxH).toBeLessThanOrEqual(geo.viewH * 0.65 + 1)
})

test('pose guide filters by occasion and cycles', async ({ page }) => {
  await gotoClean(page)
  const pose = page.locator('#pose')
  const counter = pose.getByText(/^\d+ \/ \d+$/)
  await expect(counter).toHaveText('1 / 6') // all poses
  // filtering to Maternity leaves the two maternity poses
  await pose.getByRole('button', { name: 'Maternity' }).click()
  await expect(counter).toHaveText('1 / 2')
  const name = pose.locator('h3')
  const first = await name.textContent()
  await pose.getByRole('button', { name: 'Pose berikutnya' }).click()
  await expect(counter).toHaveText('2 / 2')
  await expect(name).not.toHaveText(first!)
  // a pictogram is actually drawn
  await expect(pose.locator('svg path').first()).toBeAttached()
})

test('session builder composes the WhatsApp brief', async ({ page }) => {
  await gotoClean(page)
  const msg = page.locator('.msg')
  await expect(msg).toContainText('Halo Sukamotret')
  await expect(msg).toContainText('Dari website.')
  await expect(msg).toContainText('Estimasi :')
  // studio session carries no hour; outdoor adds the simulator's hour
  await expect(msg).not.toContainText('Jam')
  await page.locator('#sesi').getByLabel('Outdoor').check()
  await expect(msg).toContainText('Jam')
  await expect(msg).toContainText('WITA')
  // hiding prices strips the estimate from the brief, not just the card.
  // (role, not label: base-ui Switch renders a hidden checkbox beside
  // role="switch", so getByLabel is ambiguous — nuansa gotcha #8)
  await page.getByRole('switch', { name: 'Tampilkan estimasi harga' }).click()
  await expect(msg).not.toContainText('Estimasi :')
  // the CTA is a real wa.me deep link carrying the brief
  const href = await page
    .getByRole('link', { name: 'Kirim lewat WhatsApp' })
    .getAttribute('href')
  expect(href).toContain('https://wa.me/')
  expect(decodeURIComponent(href!)).toContain('Dari website.')
})

test('booking golden hour from the light bar preselects Outdoor', async ({
  page,
}) => {
  await gotoClean(page)
  await page
    .locator('#cahaya')
    .getByRole('button', { name: 'Booking slot ini' })
    .click()
  await expect(page.locator('#sesi').getByLabel('Outdoor')).toBeChecked()
  // the anchor jump must clear the sticky header (scroll-margin-top)
  const ok = await page.evaluate(() => {
    const header = document.querySelector('header')!.getBoundingClientRect()
    const sesi = document.getElementById('sesi')!.getBoundingClientRect()
    return sesi.top >= header.bottom - 1
  })
  expect(ok).toBe(true)
})

test('wipe is draggable without jailing vertical scroll', async ({
  page,
  isMobile,
}) => {
  await gotoClean(page)
  // pan-y: horizontal drags belong to the wipe, vertical pans to the page
  await expect(page.locator('.wipe')).toHaveCSS('touch-action', 'pan-y')
  if (isMobile) {
    // touchscreen.tap uses raw viewport coordinates — scroll the editor into
    // view first or the tap lands on whatever is at that y instead
    await page.locator('.wipe').scrollIntoViewIfNeeded()
    const box = (await page.locator('.wipe').boundingBox())!
    await page.touchscreen.tap(box.x + box.width * 0.3, box.y + box.height / 2)
    await expect(page.locator('#editfoto .top')).toHaveCSS(
      'clip-path',
      /inset\(0px 0px 0px (29|30|31)/
    )
  }
})
