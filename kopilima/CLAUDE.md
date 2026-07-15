# Kopi Lima — client landing page (freelance piece #2)

One-page site for a real coffee chain (Balikpapan + Samarinda). **Read
`README.md` for what it is and the launch checklist.** `lib/content.ts` is
the single content file and says exactly what's real (IG-sourced) vs dummy.
The brand identity is THEIRS, extracted from @kopilima.idn — never invent
brand elements; the IG-access setup lives in project memory (kopi-lima).

**The concept is the clock.** Everything renders from the visitor's clock
converted to WITA (`lib/jam.ts`, pure): the pit board's open/closed +
countdowns, the live hero line, and the page's ambience (`data-fase` on
`<html>`, siang/malam — CSS derives the palette). The scrubber overrides the
clock for the whole page. Zero API, zero server — that's the case-study line;
don't replace with a library.

**Layout.** `app/page.tsx` is the server shell (banner, header, footer, SEO
text). `components/interactive.tsx` is the ONE stateful client parent — it
owns the 30s WITA tick + the scrubbed-hour override, stamps `data-fase`, and
renders the sections in DOM order: Board → Reservasi → MenuCup → GerobakRoad
→ Borongan. Board and MenuCup take `menit` as a prop (board: status;
menu: the branch-exclusive item's live open state); the rest are
self-contained.

**THE BLUE WALL (V6, his approved taste — sharp corners included).** The page
ground IS the brand ultramarine; informational surfaces are cream **paper
stickers** (`.sticker` in globals.css: ink frame, hard 6px offset shadow,
sharp corners; `.sticker-pop` lifts on hover; `.sticker-checker` = checkered
top strip; alternating nth-child tilts, flattened for reduced-motion). ONE
deliberate visual world — no light/dark split; malam mixes the wall toward
night navy.
**The token trick:** components use semantic utilities (text-ink, bg-panel,
border-line, text-biru…). At `:root` they mean "on the wall" (white/lilac);
`.sticker` re-declares the same variables for "on paper" (dark ink, lima
biru), so card innards restyle without edits. **`tinta` (#161129) is the
FIXED dark ink** for badge/frame ink on any ground — unlike `--ink`, which
flips with the context. `--amber` = checkered-flag accent everywhere;
`--amber-deep` for amber-meaning text ON paper (contrast).

**Gotchas (inherited from sukamotret — verified there, respected here):**

1. `output: 'export'` has no `next start` — Playwright serves `out/` via
   `serve`. The clock MUST be computed client-side (a static export would
   freeze the build time), so it lives in a mount effect; placeholders
   render first ("menghitung…").
2. **`lib/fase-boot.ts` is a blocking `<head>` script** stamping `data-fase`
   before first paint (no palette flash). It duplicates `jam.ts`'s fase
   thresholds on purpose; the "opens already lit" smoke test is the drift
   guard — touch one, touch both. `<html>` carries `suppressHydrationWarning`
   (shallow) because of it.
3. **The Playwright suite only runs the PRODUCTION build** — dev-only
   diagnostics (hydration mismatches above all) are INVISIBLE to it. After
   touching anything pre-hydration (boot script, `<html>` attributes), boot
   `npm run dev` and read the console; a green suite does not clear you.
4. `react-hooks/set-state-in-effect` flags bare setState in an effect body —
   restructure (named fn inside the effect), don't disable.
5. In Playwright, `fill()` with a range input's CURRENT value fires no
   change event — move the slider away first if asserting a no-op default.
6. Test selectors: "Makanan" needs `exact: true` (drink cards' accessible
   names contain "makanan" too); occupied tables are asserted via their
   aria-label suffix ", terisi".

**Kopilima-specific rules:**

7. **Cities never mix** (his rule): the board renders per-city groups, or
   one city + the `.other-city` teaser. Any new branch feature must respect
   the grouping. Geolocation refuses to pick when >120 km from Kaltim.
8. The cup pour needs no JS choreography: keyed remount + `animate-pour`
   (`@keyframes pour { from { height: 0 } }` — no `to`, so it animates to
   each layer's inline height), staggered via `animationDelay`.
9. The gerobak is a `role="slider"` SVG: pointer-drag on the whole road
   (fat fingers), arrow keys step stops, `aria-valuetext` reads the babak.
   Wheel spin = rotate proportional to pct; `transformBox: 'fill-box'`.
10. Reservation is a PREFERENCE picker, not live booking — `terisi` is
    example state. Don't promise availability; the DM reply is the
    confirmation. WEB-5 in every brief = the lead counter. **The denah is a
    GRID** (`PLAN` + integer `kol`/`bar`/`lebar`/`tinggi` in content.ts,
    fixtures included): re-arranging the room means retyping small integers,
    never coordinate maths. Don't reintroduce %-of-box positioning.
11. **The menu detail body has two homes** (`components/menu-cup.tsx`): the
    sticky side panel on desktop, and **shadcn's `Dialog`** (base-ui, the
    repo's shadcn-first rule — not a hand-rolled `<dialog>`) as a popup on
    phones, where a side panel would be a scroll away. One `detail` JSX
    block, mounted in exactly ONE place at a time (`isDesktop` from a
    `matchMedia` effect; server-renders the desktop panel, corrects after
    mount — same client-only pattern as the clock). Two consequences for
    tests: (a) the popup is **portaled to `<body>`**, so never scope its
    selectors to `#menu`; (b) an open modal makes the page inert — close it
    (`getByRole('button', { name: 'Close' })`, shadcn's own) before touching
    chips behind it. The detail's photo slot is the SAME 4:3 as the cards.
    **The glass keeps a FIXED height on purpose** — stretching it to the
    description just made a tall glass with a big empty headspace (the layers
    are a fixed % of it). The leftover column space carries the "Pesan ini"
    DM CTA instead, so the detail ends in an action.
12. Test-hook classes (`.live-line .city-head .other-city .why .scrub-clock
    .stop .cup .layer .avail .peta .detail .foto-slot .pesan .drink`) ride
    alongside utilities — don't strip them.
13. **A nested `@media` inside `@layer components` in globals.css gets
    FLATTENED by the css pipeline** — the rule applies at every width
    (verified by computed-style probe). Write media-gated component styles
    as responsive Tailwind utilities on the element instead (the road's
    stop labels: `min-[36rem]:after:content-[attr(data-label)]`).
14. **`display: contents` breaks child selectors.** The grouped city view
    wraps each city's cards in a `contents` div, so `.board > article`
    matched NOTHING and the default view silently lost its sticker tilt
    (only the single-city view had it — which is why it looked fine).
    Use the descendant form; a smoke test now guards it.
15. **Contrast-check colours, don't eyeball them.** The muted and status
    colours that read fine on the blue wall are far too light on cream:
    BUKA/TUTUP, the eyebrows, and the amber "hanya di X" line all failed
    WCAG AA on first pass. Every text/ground pair is now measured (script:
    sample computed colour + walk up for the real background, compute the
    ratio). If you add a colour, measure it — status colour is meaning.
16. **The cart (`components/cart.tsx`) is EPHEMERAL on purpose** — state in
    `Interactive`, no storage, no backend, no checkout. Its job is a struk you
    show the cashier (or copy into a DM); the UI says out loud that it's only
    on your screen and dies on refresh. Don't "improve" it with
    localStorage/an order API without the owner asking — that would promise a
    system this site doesn't have. Food has no confirmed price, so it rides
    the struk marked and the total reads "+ makanan" rather than lying.
17. **The board must not resize, re-rank, or lag while the hour is scrubbed.**
    (a) The countdown text ("9 jam 8 mnt lagi") wrapped at some hours, growing
    every card ~27px and the page ~53px — the countdown now sits on its own row
    with a reserved `min-h-[2.6em]`. (b) Open-first sorting re-ranked cards
    under your finger — ranking now reads the REAL clock (`now` prop), never
    the scrubbed one, so the scrubber only previews status. (c) Lag: the
    scrubber **steps by 60 min** (`step={60}`, min 0 / max 1380 = 24 stops,
    00.00–23.00) — it answers "who's open at 3am", not "at 3:07am", and a full
    drag is 24 re-renders, not ~1440. `useDeferredValue(menit)` for the cards
    is kept as belt-and-suspenders for low-end phones. Two tests: the 24h sweep
    asserts identical height/order, and a slider-attrs check pins the step.
18. **Anything whose TEXT changes as you drag must reserve its height.** Same
    bug, two places: the board's countdown (see #17) and the gerobak road's
    caption, whose babak texts wrap to different line counts (worse on a
    phone) and shoved the page every time the cart passed a stop. The caption
    now reserves `min-h-[6.2em]` (mobile) / `4.6em` (≥36rem). A test walks all
    seven stops and asserts the page height never changes.
19. **Scrub performance:** the hour slider fires on every pixel. The thumb and
    clock read the raw value (they must track the finger); the CARDS read a
    `useDeferredValue` copy. The clock-independent sections (`Reservasi`,
    `GerobakRoad`, `Borongan`) are `memo`'d and `MenuCup` takes `now`, not
    `menit` — so a drag re-renders the board only, not a 9-table floor plan, a
    60-icon tray and 14 menu cards. `onAdd` is `useCallback`'d or the memo is
    defeated.
20. **The denah's table labels move OUT of the tables below 36rem.** A table
    is ~18px across on a phone — a label inside it is unreadable, and it also
    got painted over by the table itself. It sits in the cell's corner as a
    small chip (the chairs ride an ellipse, so corners are free); z-index
    above the table, cream background so it reads.
21. **A `<button>` vertically CENTERS its content.** A menu card stretched by
    a taller neighbour in its grid row (the one carrying a "hanya di" badge)
    pushed its own photo DOWN and left a white strip above it — on some cards
    only, which is why it read as random. Fix: `flex flex-col` on the card +
    `flex-1` on the text body, so row slack lands under the text, never above
    the photo. A test now measures every card's top gap.

**Ports:** dev + e2e on **3000** (repo convention — collides with the other
Next apps; run one at a time).

**Checks (all must stay green):** `npm run typecheck` · `npm run lint` ·
`npm run format:check` · `npm run test:e2e` (desktop + Pixel 7).

@AGENTS.md
