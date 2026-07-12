// Solar math — the page's one genuinely load-bearing computation. Two
// independent algorithms, both pure, no network, no dependency:
//   sunTimes    — NOAA sunrise equation (event times for a date)
//   sunAltitude — SunCalc's position algorithm (altitude at an instant)
// They cross-check each other: at the computed sunrise, sunAltitude reads
// ~-0.83°; at golden-hour start, ~6°. Validated against Jakarta (~06:05/17:52
// in July) and the equator at equinox. tests/smoke.spec.ts asserts the
// invariants at runtime.
import { STUDIO } from './content'

const rad = Math.PI / 180
const toJD = (d: Date) => d.getTime() / 86400000 + 2440587.5
const fromJD = (j: number) => new Date((j - 2440587.5) * 86400000)

export type SunTimes = {
  rise: Date
  set: Date
  goldenMorningEnd: Date // sun climbs past 6°
  goldenEveningStart: Date // sun drops below 6°
  dawn: Date // civil dawn, -6°
  dusk: Date // civil dusk, -6°
}

export function sunTimes(date: Date, lat: number, lon: number): SunTimes {
  const lw = -lon
  const n = Math.round(toJD(date) - 2451545.0 - 0.0009 - lw / 360)
  const Js = 2451545.0 + 0.0009 + lw / 360 + n
  const M = (357.5291 + 0.98560028 * (Js - 2451545.0)) % 360
  const C =
    1.9148 * Math.sin(M * rad) +
    0.02 * Math.sin(2 * M * rad) +
    0.0003 * Math.sin(3 * M * rad)
  const lam = (M + C + 180 + 102.9372) % 360
  const Jt = Js + 0.0053 * Math.sin(M * rad) - 0.0069 * Math.sin(2 * lam * rad)
  const dec = Math.asin(Math.sin(lam * rad) * Math.sin(23.44 * rad))
  // Hour-angle for a target altitude. Near the equator the sun always crosses
  // these altitudes, so the |cos| > 1 polar case can't occur for this studio.
  const at = (alt: number) => {
    const c =
      (Math.sin(alt * rad) - Math.sin(lat * rad) * Math.sin(dec)) /
      (Math.cos(lat * rad) * Math.cos(dec))
    const w = Math.acos(Math.max(-1, Math.min(1, c))) / rad / 360
    return { rise: fromJD(Jt - w), set: fromJD(Jt + w) }
  }
  const h = at(-0.833)
  const g = at(6)
  const b = at(-6)
  return {
    rise: h.rise,
    set: h.set,
    goldenMorningEnd: g.rise,
    goldenEveningStart: g.set,
    dawn: b.rise,
    dusk: b.set,
  }
}

const eps = 23.4397 * rad
export function sunAltitude(date: Date, lat: number, lon: number): number {
  const lw = -lon * rad
  const phi = lat * rad
  const d = toJD(date) - 2451545.0
  const M = rad * (357.5291 + 0.98560028 * d)
  const L =
    M +
    rad * 1.9148 * Math.sin(M) +
    rad * 0.02 * Math.sin(2 * M) +
    rad * 0.0003 * Math.sin(3 * M) +
    rad * 102.9372 +
    Math.PI
  const dec = Math.asin(Math.sin(eps) * Math.sin(L))
  const ra = Math.atan2(Math.sin(L) * Math.cos(eps), Math.cos(L))
  const H = rad * (280.16 + 360.9856235 * d) - lw - ra
  return (
    Math.asin(
      Math.sin(phi) * Math.sin(dec) +
        Math.cos(phi) * Math.cos(dec) * Math.cos(H)
    ) / rad
  )
}

// What the page's sections share: today's event times plus the local-midnight
// anchor that maps a minute-of-day to an absolute instant.
export type SunState = { times: SunTimes; midnight: number }

// The four states of the day. Stamped on <html> as data-phase; globals.css
// turns it into the ambient palette (accent + tinted grounds).
export type SunPhase = 'golden' | 'day' | 'blue' | 'night'

// Which state of the day an instant falls in. Pure, so it serves both the real
// clock (light-today) and a scrubbed one (the simulator relighting the page).
//
// Compared at MINUTE-OF-DAY granularity, deliberately. Golden hour really
// begins at e.g. 17:55:35, but the scrubber can only land on 17:55:00 — short
// of it. Comparing raw instants left the page stuck in `day` at exactly the
// golden hour the slider defaults to.
//
// Minutes come straight off the timestamp, NOT via `dayFraction` — that
// percentage round-trip is lossy enough to turn 17:55:00 into 1074.9999999,
// which floors to the wrong minute. This flooring matches what the clock
// actually displays (Intl truncates seconds too), so phase and clock agree.
export function sunPhase(t: SunTimes, at: Date): SunPhase {
  const min = (d: Date) =>
    Math.floor(
      (((d.getTime() / 60_000 + STUDIO.utcOffsetHours * 60) % 1440) + 1440) %
        1440
    )
  const f = min(at)
  const [dawn, rise, gmEnd, geStart, set, dusk] = [
    t.dawn,
    t.rise,
    t.goldenMorningEnd,
    t.goldenEveningStart,
    t.set,
    t.dusk,
  ].map(min)
  if ((f >= rise && f <= gmEnd) || (f >= geStart && f <= set)) return 'golden'
  if (f >= gmEnd && f < geStart) return 'day'
  if ((f >= dawn && f < rise) || (f > set && f <= dusk)) return 'blue'
  return 'night'
}

// ---- studio-local (WITA) day helpers ---------------------------------------

// Midnight of "today" in the studio's zone, as a UTC timestamp — lets a
// minute-of-day map to an absolute instant and back.
export const localMidnight = (now = new Date()) =>
  Math.floor((now.getTime() + STUDIO.utcOffsetHours * 3600000) / 86400000) *
    86400000 -
  STUDIO.utcOffsetHours * 3600000

export const atMinute = (midnight: number, m: number) =>
  new Date(midnight + m * 60000)

// Floor, not round: Intl truncates seconds, so rounding here would let the
// light bar and the scrubber print times a minute apart for one instant.
export const minuteOf = (midnight: number, d: Date) =>
  Math.floor((d.getTime() - midnight) / 60000)

export const hhmm = (m: number) =>
  String(Math.floor(m / 60)).padStart(2, '0') +
  '.' +
  String(m % 60).padStart(2, '0')

export const fmtTime = (d: Date) =>
  d.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: STUDIO.timeZone,
  })

// Fraction of the studio's local day, for positioning on the 24h bar.
export const dayFraction = (d: Date) =>
  (((d.getTime() / 3600000 + STUDIO.utcOffsetHours) % 24) / 24) * 100

export const studioSunTimes = (now = new Date()) =>
  sunTimes(now, STUDIO.lat, STUDIO.lon)

export const studioAltitude = (d: Date) =>
  sunAltitude(d, STUDIO.lat, STUDIO.lon)
