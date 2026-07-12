# Sukamotret — client landing page (freelance piece)

One-page site for a real photo studio in Tabalong. **Read `README.md` for
what it is and the launch checklist.** Everything is still **dummy data** —
`lib/content.ts` is the single content file and says exactly what's fake.

**The concept is light.** Sun math (`lib/sun.ts`) computes today's golden/blue
hours for the studio's coordinates in the visitor's browser; the scene
renderer (`lib/scene.ts`) draws from real sun altitude. Don't replace either
with a library or an API — zero-dependency and offline-correct is the point
(and the case-study line).

**Layout.** `app/page.tsx` is the server shell (chrome + SEO text).
`components/interactive.tsx` is the ONE stateful client parent — look,
intensity, hour, and location are lifted there so a choice in any section
lands in the WhatsApp brief (`session-builder.tsx`). `Interactive` also owns the
30s clock tick and the page's `data-phase` (see gotchas 16 & 19). Sections:
`light-today` (`SunArc` sky arc + `Legend`; a pure presentational card taking
`now` as a prop — it always tells the truth about the REAL clock, even when the
scrubber has relit the page; countdown + `.ics` share `nextGoldenWindow()`),
`contact-sheet` (filters +
lightbox), `simulator` (canvas + scrubber + `SunDial`), `photo-editor`
(before/after wipe + intensity slider), `pose-guide` (self-contained, no
props — pictogram SVGs typed by `FigureId` from content.ts), `session-builder`
(wa.me deep link ending "Dari website." — that suffix is the lead-counting
mechanism; never remove it).

**Style:** Tailwind v4 + shadcn (base-vega, copied from nuansa — his revised
call 2026-07-10; the plain-CSS first cut is gone). Brand tokens in
`app/globals.css` `@theme`, mapped onto shadcn semantic tokens
(`--color-primary: var(--ink)` etc.) so `ui/button` + `ui/switch` skin
themselves. The ambient palette (`--accent` + the tinted grounds) is derived in
CSS from `[data-phase]` — see gotcha 16. Custom Button variants:
`cta`, `cta-ghost`, `chip` (selected state rides `aria-pressed`). Kept
native on purpose: `<dialog>` lightbox, `<input type=range>` scrubbers,
radio/checkbox pills (peer-checked skin) — platform semantics, and the tests
target them (`getByLabel` works on native inputs; the base-ui Switch needs
`getByRole('switch')`). Test-hook classes (`.golden-range .arc-rise
.arc-set .clock .verdict .stamp .wipe .top .frame .cat .msg .lb .lb-frame
.lb-img`) ride alongside utilities — don't strip them. Bahasa-only, hardcoded
strings (YAGNI).

**Gotchas (all verified by running — don't relearn):**

1. `output: 'export'` has no `next start` — Playwright serves `out/` via
   `serve`. Sun times MUST be computed client-side (a static export would
   freeze the build day), so they live in a mount effect; placeholders render
   first ("menghitung…").
2. `react-hooks/set-state-in-effect` flags direct setState in an effect body
   but not inside a called fn — restructure (named fn inside the effect),
   don't disable.
3. The wipe uses `touch-action: pan-y` (NOT `none` — scroll-jail) + a
   `pointercancel` handler; the lightbox needs its visible ✕ (no Esc on
   phones); `scroll-margin-top: 5.5rem` clears the sticky header (~81px on
   mobile); the `.times` grid is explicit `repeat(5,1fr)` / 2-col+span
   (auto-fit leaves dead grey cells); range inputs are `step=1` (a coarser
   step snaps the golden-hour minute and the clock disagrees with the light
   bar); `minuteOf` floors (Intl truncates seconds — rounding disagrees by a
   minute).
4. Editor display never relies on `ctx.filter` (Safari): two stacked
   canvases, CSS filter + clip-path. Only the download uses `ctx.filter`,
   feature-gated (button hides if unsupported). EXIF via `createImageBitmap`
   `from-image`; uploads capped at 1600px long edge.
5. In Playwright, `touchscreen.tap` uses raw viewport coordinates —
   `scrollIntoViewIfNeeded()` first or the tap lands on the wrong element.
6. Two sections use `.verdict` — scope selectors (`#coba .verdict`).
7. A `<dialog>` is **fit-content** — without an explicit `w-[…]` the lightbox
   resizes to each caption and the popup jumps between images (regression
   test covers it).
8. The editor canvases wear `max-h-[65vh] object-contain`: a portrait upload
   would otherwise tower past the viewport. Both canvases share intrinsic
   size AND element box, so the letterboxing matches and the wipe stays
   aligned. (The pre-Tailwind stretch bug was the old global
   `.stage canvas { aspect-ratio: 16/9 }` squeezing uploads into 16:9.)
9. `Reveal` (scroll-reveal) drops its translate/opacity classes entirely once
   in view — a lingering non-none `translate` would become the containing
   block for the builder's sticky summary. Also: full-page CDP screenshots
   don't scroll, so unrevealed sections capture blank — scroll through before
   screenshotting. The builder's sticky card only engages when the form
   column is taller than it (narrow desktop); at wide viewports there is
   nothing to stick, which is correct, not broken.
10. Contact-sheet stagger keys tiles by `${filter}-${n}` — without the filter
    in the key, kept tiles reuse their DOM node and the pop-in only plays for
    newcomers.
11. Occasion labels (Wisuda/Keluarga/Maternity) now appear as buttons in THREE
    places: pose-guide filter chips, contact-sheet filter chips, session-
    builder radios. Always scope test selectors by section id
    (`#pose` / `#karya` / `#sesi`) or they collide.
12. Lightbox iris lives on `.lb-frame` (un-keyed), the swipe on the keyed
    child — a `dialog[open] .x` descendant rule out-specifies a utility
    animation on the same element, so they must be different elements.
13. Pose pictograms are hand-authored SVG path data in `pose-guide.tsx`;
    `currentColor` (from `text-ink`) makes them theme-aware. Verify figures by
    screenshot after any edit — path data has no type safety.
14. **`SunArc` replaced the old 24h gradient strip** (his call: the strip was a
    chart you had to decode). It's a picture of the sky — sunrise left, noon
    top, sunset right, sun dot at now, muted below the horizon at night.
    Golden hour is only ~30 min of a 12h day, so the amber arc segments are
    tiny stubs; the **warm haze rect** (drawn from the golden threshold's own
    y on the arc down to the horizon) is what actually communicates "good light
    lives near the horizon". **The arc MUST keep its `Legend`** — it encodes
    meaning in colour (amber = golden hour, blue = blue hour, dot = sekarang),
    and without the key those colours are just decoration. Deleting the old
    5-cell grid removed the only labels and he immediately asked what the
    colours meant. There is deliberately NO text label on the arc itself:
    wherever it was placed it crossed the curve, so the legend names the dot.
15. Test hooks in light-today changed with that redesign: `.phase`, `.time`,
    `.now` are GONE. Use `.golden-range` (hero, also the suite's ready-signal —
    it shows "—" until sun facts land), `.arc-rise`, `.arc-set`. The card's CTA
    is "Booking slot ini" (was "Booking slot golden hour").
16. **Two colour roles, don't mix them.**
    - **SEMANTIC, fixed:** `--amber` / `--blue` (and `text-amber`, `bg-amber`,
      the arc's bands, the legend swatches, the golden-hour time + countdown).
      These are the legend's KEY — amber _means_ golden hour. If they tracked
      the clock, the page would contradict itself at midday. Never wire them to
      `--accent`.
    - **AMBIENT, follows the sun:** `data-phase` (golden / day / blue / night)
      is stamped on `<html>` — first by the boot script (gotcha 19), then kept
      live by `Interactive`; `globals.css` derives `--accent` AND
      tints `--paper/--surface/--sunk` from the untinted `*-0` bases via
      `color-mix`. One block set serves both themes (the mixes read theme-aware
      tokens). The page warms at golden hour, cools at night; the ink never
      moves, so contrast holds. The hero's "memories" wears `--accent`.
    - CSS owns the palette; JS only reports what the sun is doing. `Interactive`
      owns the phase (and the 30s clock tick) — NOT light-today.
    - **The simulator's scrubber DOES relight the page** (his call, reversing an
      earlier rule): until the visitor drags it, the page is lit by the real
      sun; once they do, by the hour they picked, so they can feel golden hour
      instead of waiting six hours for it. `Interactive` holds a `scrubbed`
      flag. LOOK presets must never relight it — a look is a grade, not a time.
      `light-today` keeps telling the truth about the real clock regardless.
    - Verified by reading computed colours at faked clock times (all four
      phases), not by eye. Regression test covers scrub-relights /
      look-doesn't / semantic-colours-never-move.
17. **`sunPhase` compares MINUTE-of-day, taken straight off the timestamp —
    never via `dayFraction`.** Two real bugs live at this boundary: golden hour
    actually begins at e.g. 17:55:35 while the scrubber can only land on
    17:55:00, so comparing raw instants left the page in `day` at the exact
    hour the slider defaults to; and the fraction→minute round-trip is lossy
    enough to turn 17:55:00 into 1074.9999999, which floors to the wrong
    minute. Flooring the direct minute matches what the clock displays (Intl
    truncates seconds too), so phase and clock always agree.
18. Testing the scrubber: `fill()`-ing the value the slider ALREADY holds fires
    no change event. The simulator defaults to golden hour, so a test that
    fills `1075` first sees nothing happen — move the slider away, then back.
    (This cost me a wrong bug diagnosis.)
19. **`lib/phase-boot.ts` is a blocking `<head>` script that stamps `data-phase`
    before the first paint.** Without it the page paints with a GUESSED accent
    and visibly corrects itself — the hero's "memories" rendered amber for
    ~1.1s then faded to blue at midday. It duplicates the golden-hour maths
    from `lib/sun.ts` (a pre-paint script can't wait for the bundle); the
    coordinates are interpolated from `STUDIO` so they can't drift, and the
    "opens already lit" test guards the rest — it samples hero colour + page
    tint every frame and asserts ONE distinct state, which fails on a flash OR
    on the boot script disagreeing with `sunPhase`. Touch one, touch both.
20. `<html>` carries `suppressHydrationWarning` because that boot script adds an
    attribute the server HTML never had. It's shallow (this element's own
    attributes only) — same reason next-themes does it.
21. **The Playwright suite only ever runs the PRODUCTION build** (`output:
'export'` → `serve out`). Dev-only diagnostics — hydration mismatches
    above all — are therefore INVISIBLE to it. After touching anything that
    runs before hydration (the boot script, `<html>` attributes), boot
    `npm run dev` and read the console; a green suite does not clear you.

**Ports:** dev + e2e on **3000** (his call 2026-07-10; collides with paused
badriyatim's default — run one at a time).

**Checks (all must stay green):** `npm run typecheck` · `npm run lint` ·
`npm run format:check` · `npm run test:e2e` (desktop + Pixel 7).

@AGENTS.md
