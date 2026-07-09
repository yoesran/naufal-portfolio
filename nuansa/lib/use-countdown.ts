'use client'

import { useEffect, useState } from 'react'

const UNITS = [
  { label: 'Hari', ms: 86_400_000, wrap: 0 },
  { label: 'Jam', ms: 3_600_000, wrap: 24 },
  { label: 'Menit', ms: 60_000, wrap: 60 },
  { label: 'Detik', ms: 1_000, wrap: 60 },
] as const

/**
 * Time remaining until `targetDate` (`YYYY-MM-DD`), broken into units.
 *
 * The clock only starts after mount: the server has no idea what "now" is, so a
 * live value during SSR would guarantee a hydration mismatch. Until then — and
 * for an empty or invalid date — every unit reads zero.
 *
 * Each unit is derived independently (`wrap` rolls it into the next) rather than
 * mutating a running remainder, which React Compiler rejects during render.
 */
export function useCountdown(targetDate?: string) {
  const target = targetDate
    ? new Date(`${targetDate}T00:00:00`).getTime()
    : Number.NaN
  const valid = !Number.isNaN(target)

  const [now, setNow] = useState<number | null>(null)

  useEffect(() => {
    if (!valid) return
    const tick = () => setNow(Date.now())
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [valid])

  const total = valid && now !== null ? Math.max(0, target - now) : 0

  return UNITS.map((unit) => {
    const elapsed = Math.floor(total / unit.ms)
    return {
      label: unit.label,
      value: unit.wrap ? elapsed % unit.wrap : elapsed,
    }
  })
}
