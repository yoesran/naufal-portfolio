# Kopi Lima — landing page

**Live (draft):** <https://kopilima.pages.dev>

One-page site for **Kopi Lima** ("Daily Cruisin'"), a no-franchise coffee
chain — five branches across Balikpapan and Samarinda, three of them 24
hours, everything Rp15.000. The site's job: answer the questions customers
otherwise DM ("buka nggak sekarang? bisa nugas di sana? wifinya kencang?")
by letting them *play* the answers:

- **Papan pit stop** — which branches are open _right now_, computed in the
  browser from each branch's hours and the visitor's clock (WITA). Zero API.
  Cities are **never mixed**: Balikpapan and Samarinda are separate groups,
  and picking one shows only it plus a polite teaser to the other. A
  geolocation button sorts by distance — and declines to recommend anything
  when the visitor is far from Kaltim.
- **Vibe matcher** — chips for _nugas / nongkrong / ambil cepat / jam 2
  pagi_ re-rank the branches with a why-line (wifi, colokan, suasana).
- **Scrubber jam** — drag to any hour: the board replays and the whole page
  relights (siang/malam ambience via `data-fase`).
- **Pilih meja** — a floor plan for the reservation branch, drawn like a plan
  (walls, a blueprint floor, a door with its swing arc, and every table shown
  with its chairs, so a six-seater looks like one). The picked table rides a
  DM brief: a preference, not live booking (no backend, on purpose).
- **Keranjang** — an ephemeral mini cart: add drinks, adjust quantities, and
  you get a **struk you hold up at the counter** (or copy into a DM). Nothing
  is stored or sent anywhere — no server, no checkout — and the UI says so.
- **Menu yang dituang** — tap a drink and its layers pour into a glass;
  answers "what's in Lima Palma". Branch-exclusive items carry a badge
  (cheesecake = Lima Garden, real per IG). The detail is a **popup on
  phones** (shadcn `Dialog`, so tapping a card never means scrolling to find
  it) and the sticky side panel on desktop. Its photo slot is the same 4:3 as
  the cards, and the glass stretches to the description beside it — real
  photos drop into both without a second crop.
- **Gerobak yang ditarik** — the story as a draggable cart: wheels spin,
  branch-opening stops light up, checkered finish at today.
- **Borongan** — cup-count slider where 15k-flat makes the total one visible
  multiplication; composes a brief ending in **`Kode: WEB-5`** — the lead
  counter (IG DMs can't be prefilled, so a copy-pasted code replaces
  sukamotret's "Dari website." trick).

Bahasa-only (`lang="id"`, no i18n). Order channels are the real ones from
their bio: **Order by DM** (ig.me) + **GrabFood**.

## Status: draft — sebagian data contoh

Brand identity (ultramarine #3300f8, amber checkers, "Daily Cruisin'",
NO FRANCHISE), branch codes + hours, and menu names/descriptions come from
the real @kopilima.idn. Everything in [`lib/content.ts`](lib/content.ts)
marked DUMMY is placeholder. **Launch checklist:**

1. Logo files (the 5 monogram + wordmark) — replace the typed wordmark and
   the CSS-drawn 5; brand font names if they exist.
2. Per-branch facts: wifi speed, colokan, suasana, `cocok` tags — the vibe
   matcher is only as trustworthy as these.
3. Real Maps pins (coordinates + share links) per branch — feeds "±km" and
   the nearest-branch sort.
4. **Which branch takes reservations** + its real floor plan (the sketch
   guesses Lima Alaya). The denah is a **grid**: tables and fixtures are
   integer cells (`PLAN`, `MEJA`, `FITUR` in `lib/content.ts`), so a new
   layout is retyped numbers, not coordinate maths. Also: does Lima Garden
   belong on the board?
5. Latest menu + prices (drinks still 15k flat? food prices?), and real
   photos into the menu slots (pre-optimize at build: sharp → AVIF/WebP).
6. Branch opening dates for the gerobak road (years are estimates).
7. Confirm the WEB-5 code with the owner so the crew recognizes it in DMs.
8. `LocalBusiness` JSON-LD (per branch) + OG image; Cloudflare Web Analytics
   token.
9. Google Business Profile per branch — likely more foot traffic than the
   site; the site is what GBP links to.

## Stack

Next.js 16 (App Router, **static export**) · React 19 · **Tailwind v4 +
shadcn (base-vega / base-ui)** · Playwright.

The look is **the blue wall** (their own feed, inverted into a page): the
ground is the brand ultramarine and every informational surface is a cream
**paper sticker** — ink frame, hard offset shadow, sharp corners, slight
tilt. It commits to one visual world on purpose (no light/dark split); at
night the wall just deepens toward navy. Tokens live in
[`app/globals.css`](app/globals.css) (`@theme`), and a `.sticker` class
re-declares the same semantic tokens for "on paper", so a card's contents
restyle themselves without markup changes. Colours are contrast-checked, not
eyeballed — the muted and status colours that read fine on blue are far too
light on cream. The genuinely bespoke pieces stay native: the draggable SVG
gerobak, the CSS-drawn 5, `<input type=range>` scrubbers. Deploys like the
sibling apps: `next build` → `out/` → `wrangler pages deploy` (Cloudflare
Pages).

## Develop

```bash
npm install
npm run dev        # http://localhost:3000
```

Checks (all must stay green):

```bash
npm run typecheck && npm run lint && npm run format:check
npm run test:e2e   # builds + serves the static export itself (port 3000)
```

The smoke suite runs desktop Chrome **and Pixel 7** — the audience is
Instagram traffic, i.e. phones.
