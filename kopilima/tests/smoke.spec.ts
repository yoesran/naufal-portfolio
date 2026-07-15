import { type Page, expect, test } from '@playwright/test'

// Console errors fail the suite — the page must boot clean.
async function gotoClean(page: Page) {
  const errors: string[] = []
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))
  page.on('pageerror', (e) => errors.push(String(e)))
  await page.goto('/')
  // the WITA clock lands in a mount effect; until then the hero live-line
  // reads "menghitung…" — a real time means we're live
  await expect(page.locator('.live-line')).toContainText(/WITA/)
  return errors
}

test('renders every section without console errors', async ({ page }) => {
  const errors = await gotoClean(page)
  await expect(
    page.getByRole('heading', { name: /cruisin/i, level: 1 })
  ).toBeVisible()
  for (const id of ['buka', 'resv', 'menu', 'cerita', 'borongan']) {
    await expect(page.locator(`#${id}`)).toBeAttached()
  }
  expect(errors).toEqual([])
})

test('the page opens already lit — fase never changes after paint', async ({
  page,
}) => {
  // fase-boot stamps data-fase before first paint; hydration must agree.
  // One distinct sample proves both (any disagreement = React rewrites the
  // attribute = two samples) — same drift-guard pattern as sukamotret.
  await page.addInitScript(() => {
    const w = window as unknown as { __seen: Set<string> }
    w.__seen = new Set()
    const tick = () => {
      const f = document.documentElement.dataset.fase
      if (f)
        w.__seen.add(f + '|' + getComputedStyle(document.body).backgroundColor)
      if (performance.now() < 1500) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  })
  await gotoClean(page)
  await page.waitForTimeout(1700)
  const { seen, fase } = await page.evaluate(() => ({
    seen: [...(window as unknown as { __seen: Set<string> }).__seen],
    fase: document.documentElement.dataset.fase,
  }))
  expect(seen).toHaveLength(1)
  expect(['siang', 'malam']).toContain(fase)
})

test('pit board: cities are grouped and never mixed', async ({ page }) => {
  await gotoClean(page)
  // grouped view: two city headings (regex — they carry a decorative ●)
  await expect(page.locator('#buka .city-head')).toHaveText([
    /Balikpapan/,
    /Samarinda/,
  ])
  await expect(page.locator('#buka article')).toHaveCount(5)
  // picking a city leaves only its cards + a polite teaser to the other
  await page.getByRole('button', { name: 'Samarinda', exact: true }).click()
  await expect(page.locator('#buka article')).toHaveCount(2)
  await expect(page.locator('.other-city')).toContainText('Lagi di Balikpapan?')
  // the teaser switches city, still never mixes
  await page.locator('.other-city').click()
  await expect(page.locator('#buka article')).toHaveCount(3)
  await expect(page.locator('.other-city')).toContainText('Lagi di Samarinda?')
})

test('sticker cards are tilted in the DEFAULT grouped view', async ({
  page,
}) => {
  await gotoClean(page)
  // Regression: the grouped view wraps each city's cards in a `display:
  // contents` div, so a `.board > article` child selector matched nothing and
  // the default view silently lost its tilt (the single-city view still had
  // it, which is why it looked fine at a glance).
  const rotations = await page
    .locator('#buka article')
    .evaluateAll((els) => els.map((e) => getComputedStyle(e).rotate))
  expect(rotations).not.toContain('none')
})

test('vibe matcher re-ranks with a why-line per matching branch', async ({
  page,
}) => {
  await gotoClean(page)
  await page.getByRole('button', { name: /Mau nugas/ }).click()
  // dummy data: BB, Citra, Alaya match "nugas"
  await expect(page.locator('#buka .why')).toHaveCount(3)
  await expect(page.locator('#buka .why').first()).toContainText('Mbps')
  // toggling off clears the highlight
  await page.getByRole('button', { name: /Mau nugas/ }).click()
  await expect(page.locator('#buka .why')).toHaveCount(0)
})

test('hour scrubber drives the clock, the board, and the page fase', async ({
  page,
}) => {
  await gotoClean(page)
  const hour = page.getByLabel('Jam simulasi')
  await hour.fill('720') // 12.00 siang
  await expect(page.locator('.scrub-clock')).toHaveText('12.00')
  await expect(page.locator('html')).toHaveAttribute('data-fase', 'siang')
  await expect(page.locator('.live-line')).toContainText('(simulasi)')
  // GC (07–23) must read open at noon
  await expect(
    page.locator('#buka article', { hasText: 'Lima GC' })
  ).toContainText('BUKA')
  await hour.fill('120') // 02.00 malam
  await expect(page.locator('html')).toHaveAttribute('data-fase', 'malam')
  await expect(
    page.locator('#buka article', { hasText: 'Lima GC' })
  ).toContainText('TUTUP')
  // the 24-jam branches never close
  await expect(
    page.locator('#buka article', { hasText: 'Lima BB' })
  ).toContainText('BUKA')
  // reset returns to the real clock
  await page.getByRole('button', { name: /Kembali ke sekarang/ }).click()
  await expect(page.locator('.live-line')).not.toContainText('(simulasi)')
})

test('scrubbing the hour never moves the page', async ({ page }) => {
  await gotoClean(page)
  const hour = page.getByLabel('Jam simulasi')
  const snap = () =>
    page.evaluate(() => ({
      docH: document.documentElement.scrollHeight,
      cards: [...document.querySelectorAll('#buka article')].map((e) =>
        Math.round(e.getBoundingClientRect().height)
      ),
      order: [...document.querySelectorAll('#buka article')].map(
        (e) => e.querySelector('.font-display')!.textContent
      ),
    }))
  // Regression: the countdown ("9 jam 8 mnt lagi") used to wrap at some hours,
  // growing every card ~27px and shoving the page down mid-drag; and open-first
  // sorting re-ranked the cards under your finger. The countdown row now
  // reserves its height, and ranking reads the REAL clock, not the scrubbed one.
  // (Values are whole hours — the scrubber steps by 60 minutes.)
  await hour.fill('720')
  const a = await snap()
  for (const v of ['0', '300', '960', '1380']) {
    await hour.fill(v)
    expect(await snap()).toEqual(a)
  }
})

test('gerobak road: keyboard walks the stops to the finish', async ({
  page,
}) => {
  await gotoClean(page)
  const cart = page.getByRole('slider', { name: /geser gerobak/i })
  await cart.focus()
  for (let i = 0; i < 6; i++) await page.keyboard.press('ArrowRight')
  await expect(cart).toHaveAttribute('aria-valuenow', '6')
  await expect(page.locator('#cerita')).toContainText('Daily Cruisin’')
  // stops light up as passed
  await expect(page.locator('#cerita .stop[data-on="true"]')).toHaveCount(7)
})

test('walking the gerobak never moves the page', async ({ page }) => {
  await gotoClean(page)
  // Regression (mobile especially): each babak's text wraps to a different
  // number of lines, so the caption grew/shrank and shoved the page as the
  // cart passed each stop. Its height is now reserved for the longest one.
  const cart = page.getByRole('slider', { name: /geser gerobak/i })
  await cart.focus()
  const heights: number[] = []
  for (let i = 0; i < 7; i++) {
    heights.push(
      await page.evaluate(() => document.documentElement.scrollHeight)
    )
    await page.keyboard.press('ArrowRight')
  }
  expect(new Set(heights).size).toBe(1)
})

test('menu: a drink pours its layers; food shows a photo panel', async ({
  page,
  isMobile,
}) => {
  await gotoClean(page)
  // Selectors are NOT scoped to #menu: on a phone the detail is a portaled
  // Dialog (it lives at the end of <body>, not inside the section). And a
  // modal makes the page behind it inert, so a test must close it before
  // touching the chips — like a human would.
  const dismiss = async () => {
    if (isMobile) await page.getByRole('button', { name: 'Close' }).click()
  }
  // Lima Palma (signature) — 4 layers land in the glass
  await page.getByRole('button', { name: /Lima Palma/ }).click()
  await expect(page.locator('.cup .layer')).toHaveCount(4)
  await expect(page.locator('.avail')).toContainText('semua cabang')
  await dismiss()
  // food: no glass to pour, plus the branch-exclusive note (real: IG post)
  // exact: the drink cards' accessible names also contain "makanan"
  await page.getByRole('button', { name: 'Makanan', exact: true }).click()
  await page
    .getByRole('button', { name: /Lima Cheesecake/ })
    .first()
    .click()
  await expect(page.locator('.cup')).toHaveCount(0)
  await expect(page.locator('.avail')).toContainText('Hanya di Lima Garden')
  await expect(page.locator('.detail')).toContainText('harga menyusul')
  await dismiss()
  // picking a drink again still pours after filtering back
  await page.getByRole('button', { name: '★ Signature' }).click()
  await page.getByRole('button', { name: /Sunny Honey/ }).click()
  await expect(page.locator('.cup .layer')).toHaveCount(4)
})

test('menu detail: shadcn Dialog on a phone, inline panel on desktop', async ({
  page,
  isMobile,
}) => {
  await gotoClean(page)
  const detail = page.locator('.detail')
  if (isMobile) {
    // no panel until a card is tapped — then the Dialog brings it to you
    await expect(detail).toHaveCount(0)
    await page.getByRole('button', { name: /Lima Palma/ }).click()
    await expect(detail).toBeVisible()
    await expect(page.getByRole('dialog')).toBeVisible()
    await page.getByRole('button', { name: 'Close' }).click()
    await expect(detail).toHaveCount(0)
    await page.getByRole('button', { name: /Lima Palma/ }).click()
  } else {
    // desktop: the same body, mounted inline as the sticky panel — never a
    // dialog (nothing to open, nothing to dismiss)
    await expect(detail).toBeVisible()
    await expect(page.getByRole('dialog')).toHaveCount(0)
    await page.getByRole('button', { name: /Sunny Honey/ }).click()
    await expect(detail).toContainText('Sunny Honey')
  }
  // the photo slot matches the cards' 4:3 so real photos drop into both
  const fotoRatio = await detail.locator('.foto-slot').evaluate((el) => {
    const r = el.getBoundingClientRect()
    return r.width / r.height
  })
  expect(fotoRatio).toBeCloseTo(4 / 3, 1)
  // the space under the glass carries the action: into the cart
  await expect(detail.locator('.pesan')).toHaveText('+ Tambah')
})

test('menu cards: the photo never drifts off the top edge', async ({
  page,
}) => {
  await gotoClean(page)
  // Regression: a <button> vertically CENTERS its content, so a card stretched
  // by a taller neighbour in its grid row (the one with a "hanya di" badge)
  // pushed its photo down and showed a white strip above it. flex-col fixes it.
  const gaps = await page.locator('.drink').evaluateAll((els) =>
    els.map((btn) => {
      const b = btn.getBoundingClientRect()
      const foto = btn.firstElementChild!.getBoundingClientRect()
      return foto.top - b.top - parseFloat(getComputedStyle(btn).borderTopWidth)
    })
  )
  for (const gap of gaps) expect(gap).toBeLessThan(1)
})

test('cart: adds drinks, totals at 15k, and is a struk you can show', async ({
  page,
  isMobile,
}) => {
  await gotoClean(page)
  // no cart chrome until something is in it
  await expect(page.locator('.cart-bar')).toHaveCount(0)

  const add = async (nama: RegExp) => {
    await page.getByRole('button', { name: nama }).click()
    await page.getByRole('button', { name: '+ Tambah' }).click()
    if (isMobile) await page.getByRole('button', { name: 'Close' }).click()
  }
  await add(/Lima Palma/)
  await expect(page.locator('.cart-bar')).toContainText('Rp15.000')
  await add(/Sunny Honey/)
  await expect(page.locator('.cart-bar')).toContainText('Rp30.000')

  await page.locator('.cart-bar').click()
  const struk = page.locator('.struk')
  await expect(struk).toContainText('Lima Palma')
  await expect(struk).toContainText('Sunny Honey')
  await expect(struk.locator('.cart-total')).toContainText('Rp30.000')
  // it says out loud that nothing is stored — the site has no server
  await expect(struk).toContainText('hilang kalau halaman ditutup')

  // quantities are editable in place; the total follows
  await struk.getByRole('button', { name: 'Tambah Lima Palma' }).click()
  await expect(struk.locator('.cart-total')).toContainText('Rp45.000')
  await struk.getByRole('button', { name: 'Kurangi Sunny Honey' }).click()
  await expect(struk).not.toContainText('Sunny Honey')
  // emptying it removes the bar entirely
  await struk.getByRole('button', { name: 'Kosongkan' }).click()
  await expect(page.locator('.cart-bar')).toHaveCount(0)
})

test('menu detail: a long description never leaves a white gap', async ({
  page,
}) => {
  await gotoClean(page)
  // Lima Stroffee has the longest copy — the add button must sit at the FOOT
  // of its column (mt-auto), so leftover space closes between glass and button
  // instead of pooling under the glass.
  await page.getByRole('button', { name: /Lima Stroffee/ }).click()
  const gap = await page.locator('.detail').evaluate((el) => {
    const col = el
      .querySelector('.pesan')!
      .parentElement!.getBoundingClientRect()
    const btn = el.querySelector('.pesan')!.getBoundingClientRect()
    return col.bottom - btn.bottom
  })
  expect(Math.abs(gap)).toBeLessThan(2)
})

test('reservation: occupied tables refuse, free table composes the brief', async ({
  page,
}) => {
  await gotoClean(page)
  // terisi tables are disabled (example state, not live availability)
  await expect(
    page.getByRole('button', { name: /Meja M5.*terisi/ })
  ).toBeDisabled()
  await page.getByRole('button', { name: /Meja M4/ }).click()
  const brief = page.locator('#resv .whitespace-pre-wrap')
  await expect(brief).toContainText('M4 (4 kursi, tengah)')
  await expect(brief).toContainText('Kode: WEB-5')
  await expect(
    page.getByRole('button', { name: 'Salin reservasi' })
  ).toBeEnabled()
})

test('bulk: 15k flat math, tier labels, WEB-5 in the brief', async ({
  page,
}) => {
  await gotoClean(page)
  await page.getByLabel('Jumlah cup').fill('100')
  await expect(page.locator('#borongan')).toContainText(
    '100 × Rp15.000 = Rp1.500.000'
  )
  await expect(page.locator('#borongan')).toContainText('buat acara komunitas')
  await expect(page.locator('#borongan .whitespace-pre-wrap')).toContainText(
    'Kode: WEB-5'
  )
  // quick chips snap the count
  await page.getByRole('button', { name: '200 cup', exact: true }).click()
  await expect(page.locator('#borongan')).toContainText('Rp3.000.000')
})

test('order channels: DM and Grab links are real and external', async ({
  page,
}) => {
  await gotoClean(page)
  const dm = page.getByRole('link', { name: 'Order by DM →' })
  await expect(dm).toHaveAttribute('href', /ig\.me\/m\/kopilima\.idn/)
  await expect(dm).toHaveAttribute('target', '_blank')
  await expect(page.getByRole('link', { name: 'GrabFood' })).toHaveAttribute(
    'href',
    /r\.grab\.com/
  )
})
