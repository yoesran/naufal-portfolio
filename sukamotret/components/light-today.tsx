'use client'

import { Button } from '@/components/ui/button'
import { STUDIO } from '@/lib/content'
import { type SunState, fmtTime, studioSunTimes } from '@/lib/sun'

import { Reveal } from './reveal'

// The upcoming (or running) evening golden-hour window — today's if it hasn't
// ended, else tomorrow's. Shared by the countdown line and the .ics reminder.
function nextGoldenWindow(sun: SunState, now: Date) {
  return now < sun.times.set
    ? sun.times
    : studioSunTimes(new Date(now.getTime() + 86_400_000))
}

// The clock as a sentence, not a database field. Returns the quantity only
// ("dalam 3 jam" / "12 menit tersisa"); the caller supplies the lead so the
// two states read cleanly ("Cahaya terbaik hari ini — …" vs "Sedang
// berlangsung — …").
function countdown(
  sun: SunState,
  now: Date
): { ongoing: boolean; qty: string } {
  const w = nextGoldenWindow(sun, now)
  if (now >= w.goldenEveningStart && now < w.set) {
    const left = Math.ceil((w.set.getTime() - now.getTime()) / 60_000)
    return { ongoing: true, qty: `${left} menit tersisa` }
  }
  const mins = Math.ceil(
    (w.goldenEveningStart.getTime() - now.getTime()) / 60_000
  )
  const h = Math.floor(mins / 60)
  const m = mins % 60
  // "2 jam 0 menit" reads clumsy — drop the zero once hours carry the number
  const qty =
    h > 0 && m === 0
      ? `dalam ${h} jam`
      : `dalam ${h > 0 ? `${h} jam ` : ''}${m} menit`
  return { ongoing: false, qty }
}

// The next golden-hour window as a calendar event — pure client blob, no
// backend. Phones open .ics natively, so "ingatkan aku" costs one tap.
function downloadGoldenIcs(sun: SunState, now: Date) {
  const upcoming = nextGoldenWindow(sun, now)
  const utc = (d: Date) =>
    d
      .toISOString()
      .replace(/[-:]/g, '')
      .replace(/\.\d{3}/, '')
  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Sukamotret//Golden Hour//ID',
    'BEGIN:VEVENT',
    `UID:golden-${utc(upcoming.goldenEveningStart)}@sukamotret`,
    `DTSTAMP:${utc(now)}`,
    `DTSTART:${utc(upcoming.goldenEveningStart)}`,
    `DTEND:${utc(upcoming.set)}`,
    `SUMMARY:Golden hour — ${STUDIO.name}`,
    `DESCRIPTION:Cahaya terbaik untuk foto outdoor. Booking: ${STUDIO.siteUrl}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n')
  const a = document.createElement('a')
  a.href = URL.createObjectURL(
    new Blob([ics], { type: 'text/calendar;charset=utf-8' })
  )
  a.download = 'golden-hour-sukamotret.ics'
  a.click()
  URL.revokeObjectURL(a.href)
}

// The day's light as a picture of the sky: the sun rises at the left horizon,
// arcs over noon, sets at the right; golden hour glows amber near each horizon
// (where the sun is low is where the light is good), blue hour dips just below
// after sunset, and the dot marks the sun now. No axis to decode — it's a
// drawing of the day, not a chart of it.
function SunArc({ sun, now }: { sun: SunState; now: Date }) {
  const t = sun.times
  const rise = t.rise.getTime()
  const span = t.set.getTime() - rise
  const u = (d: Date) => (d.getTime() - rise) / span // 0 at sunrise, 1 at sunset
  const R = 128
  const cx = 160
  const baseY = 140
  const P = (uu: number) => {
    const a = Math.PI * Math.max(0, Math.min(1, uu))
    return [cx - R * Math.cos(a), baseY - R * Math.sin(a)] as const
  }
  const poly = (a: number, b: number) => {
    const pts: string[] = []
    for (let i = 0; i <= 24; i++) {
      const [x, y] = P(a + ((b - a) * i) / 24)
      pts.push(`${x.toFixed(1)},${y.toFixed(1)}`)
    }
    return pts.join(' ')
  }
  const uGmEnd = u(t.goldenMorningEnd)
  const uGeStart = u(t.goldenEveningStart)
  const nowU = u(now)
  const isDay = nowU >= 0 && nowU <= 1
  const [setX, setY] = P(1)
  const [sunX, sunY] = isDay
    ? P(nowU)
    : nowU < 0
      ? [P(0)[0], baseY + 12]
      : [setX, baseY + 12]
  // Golden hour is only ~30 min of a 12-hour day, so the amber arc segments
  // are tiny stubs. This warm haze fills the band BELOW the golden threshold's
  // own height on the arc — accurate to the geometry, and it finally shows the
  // idea: the good light lives near the horizon.
  const goldenY = P(uGmEnd)[1]

  return (
    <svg
      viewBox="0 0 320 158"
      role="img"
      aria-label={`Matahari ${isDay ? 'di atas' : 'di bawah'} cakrawala; golden hour sore ${fmtTime(t.goldenEveningStart)}`}
      className="block h-auto w-full [font-family:var(--font-mono)]"
    >
      <defs>
        <linearGradient id="golden-haze" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="var(--amber)" stopOpacity="0" />
          <stop offset="1" stopColor="var(--amber)" stopOpacity="0.22" />
        </linearGradient>
      </defs>
      <rect
        x="18"
        y={goldenY}
        width="284"
        height={baseY - goldenY}
        fill="url(#golden-haze)"
      />
      <line
        x1="18"
        y1={baseY}
        x2="302"
        y2={baseY}
        stroke="var(--line)"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <polyline
        points={poly(0, 1)}
        fill="none"
        stroke="var(--line)"
        strokeWidth="1.5"
      />
      <polyline
        points={poly(0, uGmEnd)}
        fill="none"
        stroke="var(--amber)"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <polyline
        points={poly(uGmEnd, uGeStart)}
        fill="none"
        stroke="var(--ink-faint)"
        strokeWidth="2.5"
      />
      <polyline
        points={poly(uGeStart, 1)}
        fill="none"
        stroke="var(--amber)"
        strokeWidth="4"
        strokeLinecap="round"
      />
      {/* blue hour — a short dip below the horizon after sunset */}
      <line
        x1={setX}
        y1={setY}
        x2={setX + 14}
        y2={setY + 12}
        stroke="var(--blue)"
        strokeWidth="4"
        strokeLinecap="round"
      />
      {isDay && (
        <circle cx={sunX} cy={sunY} r="12" fill="var(--amber)" opacity="0.18" />
      )}
      {/* No "SEKARANG" text on the arc — wherever it went it crossed the curve.
          The legend below names the dot instead. */}
      <circle
        cx={sunX}
        cy={sunY}
        r="6"
        fill={isDay ? 'var(--ink)' : 'var(--ink-faint)'}
        stroke="var(--surface)"
        strokeWidth="2"
      />
    </svg>
  )
}

// The key. The arc encodes meaning in colour, so it needs one — without it
// amber and blue are just decoration (he asked what they meant, which is the
// bug). Doubles as the home for "sekarang", which had nowhere to sit on the
// curve.
function Legend({ sun, now }: { sun: SunState; now: Date }) {
  const t = sun.times
  const items: [React.ReactNode, string][] = [
    [
      <span
        key="d"
        className="mt-[0.35em] inline-block size-2 shrink-0 rounded-full bg-ink"
      />,
      `sekarang ${fmtTime(now)}`,
    ],
    [
      <span
        key="g"
        className="mt-[0.55em] inline-block h-[3px] w-3.5 shrink-0 rounded-full bg-amber"
      />,
      'golden hour — cahaya hangat, terbaik untuk foto',
    ],
    [
      <span
        key="b"
        className="mt-[0.55em] inline-block h-[3px] w-3.5 shrink-0 rounded-full bg-blue"
      />,
      `blue hour — lembut, setelah terbenam (${fmtTime(t.set)}–${fmtTime(t.dusk)})`,
    ],
  ]
  return (
    <ul className="mt-2 grid gap-1 font-mono text-[0.66rem] leading-relaxed text-ink-faint">
      {items.map(([swatch, label]) => (
        // items-start, not center: these labels wrap on a phone, and a centred
        // swatch then floats between the two lines
        <li key={label} className="flex items-start gap-2">
          {swatch}
          <span>{label}</span>
        </li>
      ))}
    </ul>
  )
}

// This card always tells the truth about the REAL clock, even when the visitor
// has scrubbed the simulator and relit the page to some other hour. `now` is
// ticked in Interactive (which also owns the page's phase).
export function LightToday({
  sun,
  now,
  onBookGolden,
}: {
  sun: SunState | null
  now: Date
  onBookGolden: () => void
}) {
  const cd = sun ? countdown(sun, now) : null

  return (
    <div className="wrap">
      <Reveal delay={150}>
        <section
          className="mt-[clamp(2.5rem,6vw,4rem)] overflow-hidden rounded-[3px] border border-line bg-surface"
          id="cahaya"
          aria-labelledby="cahaya-h"
        >
          <div className="px-5 pt-4.5">
            <p className="eyebrow flex items-center gap-2" id="cahaya-h">
              {/* the dot says "live": these numbers tick with the real sun */}
              <span
                aria-hidden="true"
                className="inline-block size-1.5 animate-pulse rounded-full bg-accent"
              />
              Cahaya hari ini
            </p>
          </div>

          {/* Two columns on a wide card: full-width, the arc renders ~440px
              tall and swamps the numbers. Beside them it stays compact. */}
          <div className="grid items-center gap-x-8 gap-y-4 px-5 pt-2 pb-5 min-[52rem]:grid-cols-[1.15fr_1fr]">
            <div className="mx-auto w-full max-w-[26rem]">
              {sun ? (
                <SunArc sun={sun} now={now} />
              ) : (
                <div className="grid h-32 place-items-center font-mono text-s-1 text-ink-faint">
                  menghitung cahaya hari ini…
                </div>
              )}
              {sun && (
                <>
                  <div className="flex justify-between font-mono text-[0.66rem] text-ink-faint">
                    <span className="arc-rise">
                      terbit {fmtTime(sun.times.rise)}
                    </span>
                    <span className="arc-set">
                      terbenam {fmtTime(sun.times.set)}
                    </span>
                  </div>
                  <Legend sun={sun} now={now} />
                </>
              )}
            </div>

            <div>
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <span className="text-s-1 text-ink-soft">Golden hour sore</span>
                {/* amber, not accent: the legend says amber IS golden hour, so
                    this time must not turn blue at midday. `--accent` is left
                    to mean one thing only — the colour of the light right now. */}
                <span className="golden-range font-mono text-s2 text-amber tabular-nums">
                  {sun
                    ? `${fmtTime(sun.times.goldenEveningStart)}–${fmtTime(sun.times.set)}`
                    : '—'}
                </span>
              </div>
              <p className="mt-1.5 text-s-1 text-ink-soft">
                {cd ? (
                  <>
                    {cd.ongoing
                      ? 'Sedang berlangsung'
                      : 'Cahaya terbaik hari ini'}{' '}
                    —{' '}
                    <strong className="font-medium text-amber">{cd.qty}</strong>
                  </>
                ) : (
                  'menghitung…'
                )}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button
                  variant="chip"
                  size="auto"
                  disabled={!sun}
                  onClick={() => sun && downloadGoldenIcs(sun, now)}
                >
                  🔔 Ingatkan aku
                </Button>
                <Button variant="cta" size="auto" onClick={onBookGolden}>
                  Booking slot ini
                </Button>
              </div>
            </div>
          </div>
        </section>

        <p className="mt-6 max-w-160 border-l-2 border-accent pl-3.5 text-s-1 text-ink-faint">
          Dihitung langsung di browser dari koordinat studio — tanpa API, tanpa
          jaringan. Angkanya berubah tiap hari, jadi halaman ini tidak pernah
          basi.
        </p>
      </Reveal>
    </div>
  )
}
