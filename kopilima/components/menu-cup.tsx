'use client'

import { memo, useEffect, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { CABANG, MENU, type Sajian, fotoCss, rupiah } from '@/lib/content'
import { hhmm, isBuka } from '@/lib/jam'
import { cn } from '@/lib/utils'

import { Reveal } from './reveal'

const FILTERS = [
  ['semua', 'Semua'],
  ['sig', '★ Signature'],
  ['kopi', 'Kopi'],
  ['non-kopi', 'Non-kopi'],
  ['makanan', 'Makanan'],
] as const
type Filter = (typeof FILTERS)[number][0]

// The menu answers "what IS Lima Palma?" by pouring it: tap an item and its
// layers fill the cup. Food shows a photo panel instead (nothing to pour).
// Layers are interpretations of the IG menu copy, not kitchen recipes.
// memo: it takes `now` (which only ticks every 30s), so a scrub drag must not
// re-render 14 cards — same reason its siblings are memo'd, and why onAdd is
// useCallback'd in the parent.
export const MenuCup = memo(function MenuCup({
  menit,
  onAdd,
}: {
  menit: number | null
  onAdd: (nama: string) => void
}) {
  const [filter, setFilter] = useState<Filter>('semua')
  const [picked, setPicked] = useState<Sajian>(MENU[0])
  const [open, setOpen] = useState(false)
  // The layout decides where the detail lives. Server-render the desktop
  // panel (no `window` at build time), then correct after mount — same
  // client-only pattern as the WITA clock.
  const [isDesktop, setIsDesktop] = useState(true)
  useEffect(() => {
    const mq = matchMedia('(min-width: 52rem)')
    const sync = () => setIsDesktop(mq.matches)
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])

  const pick = (s: Sajian) => {
    setPicked(s)
    if (!isDesktop) setOpen(true) // on a phone the detail comes to you
  }

  const list = MENU.filter(
    (s) => filter === 'semua' || (filter === 'sig' ? s.sig : s.jenis === filter)
  )
  const makanan = picked.layers.length === 0
  const hanyaCabang = picked.hanya
    ? CABANG.find((c) => c.kode === picked.hanya)
    : null

  const detail = (
    <>
      {/* photo slot — SAME 4:3 as the cards, so real photos drop into both
          without a second crop */}
      <div
        aria-hidden="true"
        className="foto-slot mb-4 grid aspect-4/3 place-items-end border-[2.5px] border-tinta p-2"
        style={{ background: fotoCss(picked) }}
      >
        <small className="font-mono text-[0.55rem] tracking-[0.1em] text-white/85 uppercase [text-shadow:0_1px_3px_rgba(0,0,0,0.6)]">
          foto asli menyusul
        </small>
      </div>

      {/* The glass keeps its OWN height — stretching it just scaled up the
          empty headspace (the layers are a fixed % of it). Instead the COLUMN
          stretches (`self-stretch`) and the button is pushed to its foot
          (`mt-auto`): however long the description runs, the leftover space
          closes between glass and button rather than pooling as a white gap. */}
      <div className="flex items-stretch gap-5">
        {/* gap-3 = a guaranteed minimum breath between glass and button; the
            mt-auto below then pushes the button to the column's foot when
            there's more room than that */}
        <div className="flex w-30 flex-none flex-col gap-3 self-stretch">
          {!makanan && (
            <div
              aria-hidden="true"
              className="cup relative flex h-42 w-full flex-col justify-end overflow-hidden rounded-b-2xl border-3 border-t-[1.5px] border-ink bg-white/60"
            >
              {/* keyed remount replays the pour; `from {height:0}` animates to
                  each layer's inline height */}
              {picked.layers.map((L, i) => (
                <div
                  key={`${picked.nama}-${L[0]}`}
                  className="layer w-full animate-pour"
                  style={{
                    height: `${L[2]}%`,
                    background: L[1],
                    animationDelay: `${(picked.layers.length - 1 - i) * 90}ms`,
                  }}
                />
              ))}
              <span className="absolute inset-x-[8%] top-[42%] -rotate-2 border border-[#ccc] bg-white/90 p-1.5 font-mono text-[0.5rem] leading-relaxed text-[#14102e]">
                KOPI LIMA · {picked.nama} ·{' '}
                {picked.harga === null ? '—' : '15K'}
              </span>
            </div>
          )}
          {/* the detail ends in an action: into the cart, which becomes the
              struk you hold up at the counter */}
          <Button
            variant="cta"
            size="auto"
            className="pesan mt-auto w-full px-2 py-2.5 text-center text-[0.85rem]"
            onClick={() => onAdd(picked.nama)}
          >
            + Tambah
          </Button>
        </div>

        <div key={picked.nama} className="min-w-0 flex-1 animate-swap-in">
          <h3 className="text-s1 text-biru italic">{picked.nama}</h3>
          <div className="font-mono text-[0.78rem] text-ink-faint">
            {picked.harga === null
              ? 'harga menyusul dari pemilik'
              : `${rupiah(picked.harga)} — seperti semuanya`}
          </div>
          {picked.layers.length > 0 && (
            <ul className="mt-2.5 grid list-none gap-1.5 p-0 text-s-1 text-ink-soft">
              {picked.layers.map((L) => (
                <li key={L[0]} className="flex items-center gap-2">
                  <span
                    aria-hidden="true"
                    className="size-3 flex-none rounded-[3px] border border-black/20"
                    style={{ background: L[1] }}
                  />
                  {L[0]}
                </li>
              ))}
            </ul>
          )}
          <p className="mt-3 text-s-1 text-ink-soft">
            {picked.desc}
            {!makanan && ' (resep = interpretasi, perlu konfirmasi)'}
          </p>
          <p className="avail mt-2 text-s-1 font-bold text-amber-deep">
            {picked.hanya
              ? `⭐ Hanya di ${picked.hanya}` +
                (hanyaCabang && menit !== null
                  ? isBuka(hanyaCabang, menit)
                    ? ' — buka sekarang'
                    : ` — tutup, buka ${hhmm(hanyaCabang.buka)}`
                  : ' (cabang belum masuk papan — konfirmasi pemilik)')
              : 'Tersedia di semua cabang.'}
          </p>
        </div>
      </div>
    </>
  )

  return (
    <section
      className="wrap py-[clamp(2.6rem,6vw,4rem)]"
      id="menu"
      aria-labelledby="menu-h"
    >
      <Reveal>
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4 border-b-4 border-white pb-2.5">
          <h2 id="menu-h" className="text-s3">
            All items 15K{' '}
            <span className="script text-[0.6em]">
              tuang dulu, pilih kemudian
            </span>
          </h2>
          <p className="eyebrow">ketuk menu — gelasnya terisi</p>
        </div>

        <div
          className="mb-5 flex flex-wrap gap-2"
          role="group"
          aria-label="Saring menu"
        >
          {FILTERS.map(([k, label]) => (
            <Button
              key={k}
              variant="chip"
              size="auto"
              aria-pressed={filter === k}
              onClick={() => setFilter(k)}
            >
              {label}
            </Button>
          ))}
        </div>

        <div className="grid grid-cols-1 items-start gap-7 min-[52rem]:grid-cols-[1.15fr_0.85fr]">
          <div
            className="drink-list grid grid-cols-2 gap-4 min-[36rem]:grid-cols-3"
            role="group"
            aria-label="Pilih sajian"
          >
            {list.map((s) => (
              <button
                key={s.nama}
                type="button"
                aria-pressed={picked.nama === s.nama}
                onClick={() => pick(s)}
                className={cn(
                  // flex-col, NOT the default block: a <button> vertically
                  // CENTERS its content, so when a grid row stretched a card
                  // to match a taller neighbour (the one with a "hanya di"
                  // badge) the photo drifted down and left a white strip on
                  // top. Stacking from the top kills that.
                  'drink sticker sticker-pop flex cursor-pointer flex-col overflow-hidden p-0 text-left',
                  'aria-pressed:rotate-0 aria-pressed:shadow-[4px_4px_0_var(--amber)] aria-pressed:outline-[3px] aria-pressed:-outline-offset-1 aria-pressed:outline-amber'
                )}
              >
                <span
                  className="grid aspect-[4/3] place-items-end border-b-[2.5px] border-tinta p-2"
                  style={{ background: fotoCss(s) }}
                >
                  <small className="font-mono text-[0.52rem] tracking-[0.1em] text-white/75 uppercase [text-shadow:0_1px_3px_rgba(0,0,0,0.6)]">
                    foto menyusul
                  </small>
                </span>
                {/* flex-1: the body soaks up any row-stretch slack, so the
                    extra height lands under the text, never above the photo */}
                <span className="block flex-1 px-3 pt-2 pb-2.5">
                  <span
                    className={cn(
                      'block font-display text-s0 uppercase italic',
                      s.sig && 'text-biru'
                    )}
                  >
                    {s.nama}
                    {s.sig ? ' ★' : ''}
                  </span>
                  <span className="font-mono text-[0.62rem] tracking-[0.08em] text-ink-faint uppercase">
                    {s.jenis} · {s.harga === null ? 'harga menyusul' : '15K'}
                  </span>
                  {s.hanya && (
                    <span className="mt-1.5 block w-fit -rotate-1 border border-tinta bg-amber px-1.5 py-0.5 font-mono text-[0.56rem] font-bold tracking-[0.08em] text-tinta uppercase">
                      hanya di {s.hanya}
                    </span>
                  )}
                </span>
              </button>
            ))}
          </div>

          {/* Same detail body, two homes: the sticky side panel on desktop,
              a shadcn Dialog (base-ui) popup on phones — where a side panel
              would be a scroll away, which was the complaint. Only ONE is
              mounted at a time, so `.detail` stays a unique test hook. */}
          {isDesktop ? (
            <div className="detail sticker sticky top-24 -rotate-[0.5deg] px-5 pt-5 pb-6">
              {detail}
            </div>
          ) : (
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogContent className="detail sticker max-h-[88vh] gap-0 overflow-y-auto rounded-none p-5 ring-0">
                {/* the visible name lives in the body; base-ui still wants a
                    title for the accessible name */}
                <DialogTitle className="sr-only">{picked.nama}</DialogTitle>
                {detail}
              </DialogContent>
            </Dialog>
          )}
        </div>

        <p className="mt-6 max-w-160 border-l-3 border-amber pl-3.5 text-s-1 text-ink-faint">
          Menu dari highlight IG (2023–24) — daftar &amp; harga terbaru menunggu
          pemilik. Slot foto siap: kirim foto asli, gradient ini diganti.
        </p>
      </Reveal>
    </section>
  )
})
