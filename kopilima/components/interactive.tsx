'use client'

import { useCallback, useEffect, useState } from 'react'

import { CABANG } from '@/lib/content'
import { fase, hhmm, isBuka, witaNow } from '@/lib/jam'

import { Board } from './board'
import { Borongan } from './borongan'
import { type Cart, CartBar } from './cart'
import { GerobakRoad } from './gerobak-road'
import { MenuCup } from './menu-cup'
import { Reservasi } from './reservasi'
import { Reveal } from './reveal'

// The one stateful parent: it owns the WITA clock (30s tick) and the
// scrubbed-hour override, and stamps data-fase on <html> — CSS derives the
// palette from that one attribute (fase-boot.ts stamped it pre-paint; this
// keeps it live and honours the scrubber). Sections that don't need the
// clock are still rendered here for DOM order.
export function Interactive() {
  // null until mount: the clock is the visitor's — a static export can't
  // know it, so the server HTML renders placeholders (hydration-safe).
  const [now, setNow] = useState<number | null>(null)
  const [scrubbed, setScrubbed] = useState<number | null>(null)
  // Ephemeral by design — a struk to show the cashier, not an order system.
  const [cart, setCart] = useState<Cart>({})

  useEffect(() => {
    // named fn, not bare setState in the effect body (react-hooks rule)
    const tick = () => setNow(witaNow())
    tick()
    const id = setInterval(tick, 30_000)
    return () => clearInterval(id)
  }, [])

  const menit = scrubbed ?? now

  useEffect(() => {
    // one attribute; globals.css derives the ambience
    if (menit !== null) document.documentElement.dataset.fase = fase(menit)
  }, [menit])

  const open =
    menit === null ? null : CABANG.filter((c) => isBuka(c, menit)).length

  // Stable identity: without it every scrub tick would hand MenuCup a new
  // callback and defeat its memo, re-rendering all 14 menu cards mid-drag.
  const addToCart = useCallback(
    (nama: string) => setCart((c) => ({ ...c, [nama]: (c[nama] ?? 0) + 1 })),
    []
  )

  return (
    <>
      <div className="wrap overflow-hidden pt-[clamp(2.5rem,7vw,4.5rem)] pb-[clamp(2rem,5vw,3rem)]">
        <Reveal>
          <div className="grid grid-cols-1 items-center gap-6 min-[52rem]:grid-cols-[1.35fr_1fr]">
            <div>
              <p className="eyebrow">
                Balikpapan · Samarinda — sejak gerobak, Februari 2024
              </p>
              <h1 className="mt-2 text-s4">
                <span className="script text-[0.45em]">Daily</span>
                <br />
                <span className="text-amber">Cruisin’.</span>
                <br />
                Jam berapa pun.
              </h1>
              <p className="mt-4 max-w-136 text-s0 leading-normal text-ink-soft">
                Tiga cabang nyala 24 jam. Dua lagi buka sebelum kamu bangun. Mau
                nugas, nongkrong, atau cuma lewat — ada Lima yang pas.
              </p>
              <p className="live-line sticker mt-6 inline-flex -rotate-1 items-baseline gap-2.5 px-4 py-2.5 font-mono text-s-1 tabular-nums">
                <span
                  aria-hidden="true"
                  className="inline-block size-2 animate-pulse-dot self-center rounded-full bg-buka"
                />
                <span>
                  {menit === null
                    ? 'menghitung…'
                    : `${hhmm(menit)} WITA — ${open} dari ${CABANG.length} pit stop buka${scrubbed !== null ? ' (simulasi)' : ''}`}
                </span>
              </p>
            </div>
            <div className="lima5" aria-hidden="true">
              5
            </div>
          </div>
        </Reveal>
      </div>

      <div className="checker" aria-hidden="true" />
      <Board
        menit={menit}
        now={now}
        scrubbed={scrubbed}
        onScrub={setScrubbed}
      />
      <div className="checker" aria-hidden="true" />
      <Reservasi />
      <div className="checker" aria-hidden="true" />
      {/* `now`, not `menit`: the menu's only clock use is "is Lima Garden open
          right now" for the branch-exclusive item — that must tell the truth
          about the REAL time, not the hour someone is scrubbing. It also means
          the menu doesn't re-render at all while the scrubber moves. */}
      <MenuCup menit={now} onAdd={addToCart} />
      <div className="checker" aria-hidden="true" />
      <GerobakRoad />
      <div className="checker" aria-hidden="true" />
      <Borongan />
      <CartBar cart={cart} setCart={setCart} />
    </>
  )
}
