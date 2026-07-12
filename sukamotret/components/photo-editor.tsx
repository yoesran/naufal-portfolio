'use client'

import { useEffect, useRef, useState } from 'react'

import { Button } from '@/components/ui/button'
import { type Look, lookFilter } from '@/lib/content'
import { drawScene } from '@/lib/scene'
import { type SunState, minuteOf } from '@/lib/sun'
import { cn } from '@/lib/utils'

import { LookChips } from './look-chips'
import { Reveal } from './reveal'

// Before/after wipe on the visitor's own photo. Two stacked canvases hold the
// SAME pixels; the top one wears the look as a CSS filter and a clip-path
// wipe. Display never depends on ctx.filter (Safari) — only the download
// does, and that button feature-gates itself away. The photo goes file →
// canvas inside the browser: nothing is ever uploaded, which is both the
// privacy line on the page and the hosting bill.
export function PhotoEditor({
  sun,
  look,
  setLook,
  intensity,
  setIntensity,
}: {
  sun: SunState | null
  look: Look
  setLook: (l: Look) => void
  intensity: number
  setIntensity: (n: number) => void
}) {
  const baseRef = useRef<HTMLCanvasElement>(null)
  const topRef = useRef<HTMLCanvasElement>(null)
  const wipeRef = useRef<HTMLDivElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const [wipe, setWipe] = useState(50)
  const [isDemo, setIsDemo] = useState(true)
  const [canDownload, setCanDownload] = useState(true)
  // the divider nudges once to say "drag me"; any interaction retires it
  const [interacted, setInteracted] = useState(false)
  const draggingRef = useRef(false)

  // ctx.filter probe (Safari historically lacks it): without it the download
  // would silently save the ungraded original — hide the button instead.
  useEffect(() => {
    const probeFilterSupport = () => {
      const probe = document.createElement('canvas').getContext('2d')
      if (!probe || typeof probe.filter !== 'string') setCanDownload(false)
    }
    probeFilterSupport()
  }, [])

  // Seed with the golden-hour scene so the wipe demonstrates itself before
  // anyone picks a file. Runs once when sun facts arrive; never overwrites an
  // uploaded photo (isDemo only ever goes false after this).
  const seededRef = useRef(false)
  useEffect(() => {
    if (!sun || seededRef.current) return
    seededRef.current = true
    const golden = minuteOf(sun.midnight, sun.times.goldenEveningStart)
    for (const ref of [baseRef, topRef]) {
      const c = ref.current
      if (!c) continue
      c.width = 960
      c.height = 540
      const cx = c.getContext('2d')
      if (cx) drawScene(cx, sun.midnight, golden)
    }
  }, [sun])

  const setSource = (src: CanvasImageSource, w: number, h: number) => {
    // Cap the long edge: a 12MP phone photo would otherwise make two huge
    // canvases for what is only a preview.
    const scale = Math.min(1, 1600 / Math.max(w, h))
    const W = Math.round(w * scale)
    const H = Math.round(h * scale)
    for (const ref of [baseRef, topRef]) {
      const c = ref.current
      if (!c) continue
      c.width = W
      c.height = H
      c.getContext('2d')?.drawImage(src, 0, 0, W, H)
    }
    setIsDemo(false)
    setWipe(50)
  }

  const loadPhoto = async (file: File | undefined | null) => {
    if (!file || !file.type.startsWith('image/')) return
    try {
      // from-image: honour EXIF rotation, or portrait phone shots arrive sideways
      const bmp = await createImageBitmap(file, {
        imageOrientation: 'from-image',
      })
      setSource(bmp, bmp.width, bmp.height)
    } catch {
      const url = URL.createObjectURL(file)
      const img = new Image()
      img.onload = () => {
        setSource(img, img.naturalWidth, img.naturalHeight)
        URL.revokeObjectURL(url)
      }
      img.src = url
    }
  }

  const wipeFromClientX = (clientX: number) => {
    const el = wipeRef.current
    if (!el) return
    const r = el.getBoundingClientRect()
    setWipe(Math.max(0, Math.min(100, ((clientX - r.left) / r.width) * 100)))
  }

  const download = () => {
    const base = baseRef.current
    if (!base) return
    const c = document.createElement('canvas')
    c.width = base.width
    c.height = base.height
    const x = c.getContext('2d')
    if (!x) return
    x.filter = lookFilter(look, intensity)
    x.drawImage(base, 0, 0)
    x.filter = 'none'
    // wordmark stamp — the shared photo carries the studio. Small on purpose;
    // whether to keep it at all is the studio's call (one line to remove).
    x.font = `${Math.max(14, Math.round(c.width * 0.018))}px ui-monospace, monospace`
    x.fillStyle = 'rgba(244,233,216,.85)'
    x.shadowColor = 'rgba(0,0,0,.6)'
    x.shadowBlur = 6
    x.textAlign = 'right'
    x.fillText('SUKAMOTRET', c.width - 16, c.height - 16)
    const a = document.createElement('a')
    a.download = `sukamotret-${look.toLowerCase().replace(/\s+/g, '-')}.jpg`
    a.href = c.toDataURL('image/jpeg', 0.92)
    a.click()
  }

  const sideBadge =
    'absolute top-2 bg-[rgba(20,16,14,0.55)] px-1.5 py-px font-mono text-[0.6rem] tracking-[0.12em] text-[#f4e9d8] uppercase pointer-events-none'

  return (
    <section
      className="wrap py-[clamp(3.5rem,9vw,6rem)]"
      id="editfoto"
      aria-labelledby="edit-h"
    >
      <Reveal>
        <div className="mb-8 flex flex-wrap items-end justify-between gap-5 border-b border-line pb-4">
          <h2 id="edit-h" className="text-s3 leading-tight">
            Edit fotomu
          </h2>
          <p className="eyebrow">sebelum · sesudah — geser pembatasnya</p>
        </div>

        <div className="grid grid-cols-1 items-start gap-[clamp(1.5rem,4vw,2.5rem)] min-[52rem]:grid-cols-[1.4fr_1fr]">
          <div>
            <div className="relative overflow-hidden rounded-[2px] border border-line bg-sunk">
              {/* touch-pan-y, not touch-none: a thumb landing on the photo
                mid-scroll must still scroll the page; only horizontal drags
                belong to the wipe. */}
              <div
                className="wipe relative cursor-ew-resize touch-pan-y select-none"
                ref={wipeRef}
                onPointerDown={(e) => {
                  draggingRef.current = true
                  setInteracted(true)
                  e.currentTarget.setPointerCapture(e.pointerId)
                  wipeFromClientX(e.clientX)
                }}
                onPointerMove={(e) =>
                  draggingRef.current && wipeFromClientX(e.clientX)
                }
                onPointerUp={() => (draggingRef.current = false)}
                // pan-y hands vertical pans back to the browser via
                // pointercancel — stop dragging then, or the divider chases a
                // finger that is now scrolling.
                onPointerCancel={() => (draggingRef.current = false)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault()
                  loadPhoto(e.dataTransfer.files[0])
                }}
              >
                {/* max-h + object-contain: a portrait phone photo would
                  otherwise make this box taller than the viewport. Both
                  canvases share intrinsic size AND element box, so the
                  letterboxing is identical and the wipe stays aligned. */}
                <canvas
                  ref={baseRef}
                  width={960}
                  height={540}
                  role="img"
                  aria-label="Fotomu, versi asli"
                  className="block h-auto max-h-[65vh] w-full object-contain"
                />
                <canvas
                  ref={topRef}
                  className="top absolute inset-0 h-full w-full object-contain"
                  width={960}
                  height={540}
                  aria-hidden="true"
                  style={{
                    filter: lookFilter(look, intensity),
                    clipPath: `inset(0 0 0 ${wipe}%)`,
                  }}
                />
                <span className={`${sideBadge} left-2.5`}>Asli</span>
                <span className={`${sideBadge} right-2.5`}>{look}</span>
                <div
                  className={cn(
                    'absolute top-0 bottom-0 w-0.5 -translate-x-px bg-[#f4e9d8] shadow-[0_0_0_1px_rgba(0,0,0,0.45)]',
                    // "drag me" hint: two gentle sways, retired on first touch
                    !interacted && 'animate-nudge'
                  )}
                  style={{ left: `${wipe}%` }}
                >
                  <span
                    className="absolute top-1/2 left-1/2 grid size-11 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-[#f4e9d8]/50 bg-[rgba(20,16,14,0.72)] text-[0.85rem] text-[#f4e9d8]"
                    aria-hidden="true"
                  >
                    ↔
                  </span>
                </div>
              </div>
              <span className="stamp pointer-events-none absolute bottom-2 left-2.5 font-mono text-[0.62rem] tracking-[0.12em] text-[#f4e9d8] [text-shadow:0_1px_4px_rgba(0,0,0,0.8)]">
                {isDemo ? 'contoh · unggah fotomu sendiri' : `fotomu · ${look}`}
              </span>
            </div>

            <div className="mt-4 grid gap-2">
              <input
                type="range"
                min={0}
                max={100}
                step={1}
                value={Math.round(wipe)}
                aria-label="Posisi pembanding sebelum-sesudah"
                onChange={(e) => {
                  setInteracted(true)
                  setWipe(+e.target.value)
                }}
              />
            </div>

            <div
              className="mt-1.5 flex flex-wrap gap-2"
              role="group"
              aria-label="Pilih look untuk fotomu"
            >
              <LookChips look={look} setLook={setLook} />
            </div>

            {/* Netral is the identity filter — an intensity slider on it
                would be a knob that does nothing */}
            {look !== 'Netral' && (
              <div className="mt-3 grid gap-1">
                <div className="flex items-baseline justify-between font-mono text-[0.66rem] tracking-[0.12em] text-ink-faint uppercase">
                  <span>Intensitas look</span>
                  <span className="tabular-nums">{intensity}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={5}
                  value={intensity}
                  aria-label="Intensitas look"
                  onChange={(e) => setIntensity(+e.target.value)}
                />
              </div>
            )}
          </div>

          <div className="grid gap-5">
            <p className="border-l-2 border-accent pl-3.5 text-s0 leading-normal text-ink-soft [&_b]:font-medium [&_b]:text-ink">
              <b>Coba dengan fotomu sendiri.</b> Kiri versi asli, kanan sudah
              digrading ala studio. Geser pembatasnya — lalu pilih look yang
              paling kamu suka.
            </p>
            <Button
              variant="cta"
              size="auto"
              onClick={() => fileRef.current?.click()}
            >
              Unggah foto
            </Button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="sr-only"
              aria-label="Pilih berkas foto"
              onChange={(e) => loadPhoto(e.target.files?.[0])}
            />
            {canDownload && (
              <Button variant="cta-ghost" size="auto" onClick={download}>
                Unduh hasil
              </Button>
            )}
            <p className="text-s-1 text-ink-faint">
              Fotomu diproses sepenuhnya di browser — tidak pernah diunggah ke
              mana pun. Look yang kamu pilih di sini ikut tercantum di pesan
              WhatsApp.
            </p>
          </div>
        </div>
      </Reveal>
    </section>
  )
}
