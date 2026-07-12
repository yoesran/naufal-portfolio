# Sukamotret — studio landing page

**Live (draft):** <https://sukamotret.pages.dev>

A one-page site for **Sukamotret**, a photo studio in Tabalong, South
Kalimantan ("Turning Moment Into Memories"). The studio's craft is knowing
when light is good — so the page is built around **light**:

- **Cahaya hari ini** — the day's light drawn as a **sky arc**: the sun rises
  at the left horizon, arcs over noon, sets at the right, with a warm haze
  where the light is good and a dot marking the sun right now. Computed in the
  browser from the studio's real coordinates (NOAA solar math, no API, no
  network). Beside it, the one number that matters — golden hour, and how soon.
  The page accent follows the real sun phase.
- **Coba cahayanya** — a day scrubber that redraws a canvas scene from the
  real sun altitude: shadow length is `height / tan(altitude)`, rim light
  peaks a few degrees above the horizon, noon goes flat and harsh. The
  argument for booking golden hour, made interactive.
- **Edit fotomu** — a before/after wipe on the visitor's own photo with seven
  film/analog grading looks (Instagram's famous filters were film emulations;
  face-filter gimmicks would be off-brand for a studio) and an intensity
  slider. Entirely client-side: the photo never leaves the device.
- **Panduan pose** — a pose guide: pictogram mannequins + one-line direction
  in plain Bahasa, filtered by session type. The studio's real value is
  _direction_ — most clients freeze because they don't know what to do with
  their hands.
- **Rancang sesi** — composes a WhatsApp brief (session, location, duration,
  add-ons, the chosen hour, look + intensity). Every message ends with
  _"Dari website."_ so the studio can count site-sourced leads inside
  WhatsApp itself — no dashboard, no cost.
- **🔔 Ingatkan aku** — one tap downloads a `.ics` for the next golden-hour
  window; phones open it straight into the calendar.

Bahasa-only (`lang="id"`, no i18n — the audience is local). Bespoke CSS, not
the portfolio's design system: this is a client brand.

## Status: draft — dummy data

Everything in [`lib/content.ts`](lib/content.ts) is placeholder until the
studio confirms it. **Launch checklist:**

1. Real photos into the contact sheet (replace `PORTFOLIO` gradient tiles;
   pre-optimize at build — sharp → AVIF/WebP + blur placeholders).
2. Real facts: hours, phone, which Instagram account, prices (public or
   DM-only — the UI supports both via the price toggle). _Coordinates + the
   maps link are already real_ (from the studio's Google Maps pin).
3. Real WhatsApp number (`STUDIO.whatsapp` — currently deliberately fake).
4. Watermark on the editor's download: keep or remove (studio's call).
5. Confirm prices, then the session-builder estimates are live.
6. `LocalBusiness` JSON-LD + OG image; Cloudflare Web Analytics token.
7. Google Business Profile for the studio — likely more leads than the site;
   the site is what GBP links to.

## Stack

Next.js 16 (App Router, **static export**) · React 19 · **Tailwind v4 +
shadcn (base-vega / base-ui)** · Playwright. Brand tokens live in
`app/globals.css` (`@theme`), mapped onto shadcn's semantic tokens so the
`ui/` primitives skin themselves. The genuinely bespoke pieces stay native
on purpose: the canvas scene, `<dialog>` lightbox, and `<input type=range>`
scrubbers (platform semantics beat a library there). Deploys like the
sibling apps: `next build` → `out/` → `wrangler pages deploy`
(Cloudflare Pages).

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
