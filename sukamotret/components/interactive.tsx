'use client'

import { useEffect, useState } from 'react'

import { DEFAULT_LOOK, type LocationLabel, type Look } from '@/lib/content'
import {
  type SunState,
  atMinute,
  localMidnight,
  minuteOf,
  studioSunTimes,
  sunPhase,
} from '@/lib/sun'

import { ContactSheet } from './contact-sheet'
import { LightToday } from './light-today'
import { PhotoEditor } from './photo-editor'
import { PoseGuide } from './pose-guide'
import { SessionBuilder } from './session-builder'
import { Simulator } from './simulator'

// The one stateful parent: the light bar, simulator, editor, and builder all
// read the same look / intensity / hour / location, so a choice made anywhere
// lands in the WhatsApp brief. Plain prop drilling — they don't earn a
// context. (PoseGuide carries its own state and takes no props — it lives
// here only for DOM order, between "edit your photo" and "book".)

export function Interactive() {
  // Sun facts are the visitor's "today" — client-only by design (a static
  // export would otherwise freeze the build day). Placeholder-render until
  // mounted; the effect is the standard client-only-value pattern.
  const [sun, setSun] = useState<SunState | null>(null)
  const [look, setLook] = useState<Look>(DEFAULT_LOOK)
  const [intensity, setIntensity] = useState(100) // look strength, editor-set
  const [hourMin, setHourMin] = useState(1074) // ≈ golden hour; snapped on mount
  const [loc, setLoc] = useState<LocationLabel>('Studio')

  // The real clock, ticking — the light card reads it, and it lights the page
  // until the visitor takes the wheel.
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    // One-shot client init (not a subscription): sun facts depend on the
    // visitor's clock, so they can only exist after mount.
    const init = () => {
      const at = new Date()
      const midnight = localMidnight(at)
      const times = studioSunTimes(at)
      setSun({ times, midnight })
      setHourMin(minuteOf(midnight, times.goldenEveningStart))
    }
    init()
  }, [])

  // Has the visitor dragged the simulator's clock? Until they do, the page is
  // lit by the REAL sun. Once they do, it's lit by the hour they picked — so
  // they can feel golden hour instead of waiting six hours for it. (The light
  // card keeps telling the truth about the actual time either way.)
  const [scrubbed, setScrubbed] = useState(false)
  const scrubHour = (m: number) => {
    setScrubbed(true)
    setHourMin(m)
  }

  const phase = sun
    ? sunPhase(sun.times, scrubbed ? atMinute(sun.midnight, hourMin) : now)
    : null
  useEffect(() => {
    // One attribute; globals.css derives the accent and tints every ground.
    if (phase) document.documentElement.dataset.phase = phase
  }, [phase])

  const bookOutdoor = () => {
    setLoc('Outdoor')
    document.getElementById('sesi')?.scrollIntoView({
      behavior: matchMedia('(prefers-reduced-motion: reduce)').matches
        ? 'auto'
        : 'smooth',
    })
  }

  return (
    <>
      <LightToday sun={sun} now={now} onBookGolden={bookOutdoor} />
      <ContactSheet />
      <Simulator
        sun={sun}
        hourMin={hourMin}
        setHourMin={scrubHour}
        look={look}
        setLook={setLook}
        onBookThisHour={bookOutdoor}
      />
      <PhotoEditor
        sun={sun}
        look={look}
        setLook={setLook}
        intensity={intensity}
        setIntensity={setIntensity}
      />
      <PoseGuide />
      <SessionBuilder
        sun={sun}
        hourMin={hourMin}
        look={look}
        intensity={intensity}
        loc={loc}
        setLoc={setLoc}
      />
    </>
  )
}
