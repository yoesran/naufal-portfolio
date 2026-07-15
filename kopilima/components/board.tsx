'use client'

import { useDeferredValue, useState } from 'react'

import { Button } from '@/components/ui/button'
import { CABANG, type Cabang, VIBES, VIBE_WHY, type Vibe } from '@/lib/content'
import { hhmm, isBuka, kmTo, lagi } from '@/lib/jam'
import { cn } from '@/lib/utils'

import { Reveal } from './reveal'

type Kota = Cabang['kota']
type Pos = { lat: number; lon: number }

// Beda kota = beda dunia: rekomendasi tidak pernah menyeberang kota. Papan
// dikelompokkan per kota; memilih kota (manual atau via geolokasi) menyisakan
// satu grup + teaser sopan ke kota satunya.
export function Board({
  menit,
  now,
  scrubbed,
  onScrub,
}: {
  menit: number | null // what the board DISPLAYS (may be scrubbed)
  now: number | null // the REAL clock — ranking only
  scrubbed: number | null
  onScrub: (m: number | null) => void
}) {
  const [kota, setKota] = useState<Kota | null>(null)
  const [vibe, setVibe] = useState<Vibe | null>(null)
  const [userPos, setUserPos] = useState<Pos | null>(null)
  const [geoNote, setGeoNote] = useState('')

  // The slider fires on every pixel of a drag, and each event re-renders five
  // cards' worth of clock maths — fast drags felt laggy. The THUMB and clock
  // keep the raw value (they must track the finger exactly); the cards read a
  // deferred copy, so React can drop intermediate frames under load.
  const cardMenit = useDeferredValue(menit)

  const cari = () => {
    setGeoNote('mencari lokasimu…')
    if (!navigator.geolocation) {
      setGeoNote('Perangkat tidak mendukung lokasi — pilih kota manual.')
      return
    }
    navigator.geolocation.getCurrentPosition(
      (p) => {
        const pos = { lat: p.coords.latitude, lon: p.coords.longitude }
        const nearest = CABANG.slice().sort(
          (a, b) => kmTo(pos, a) - kmTo(pos, b)
        )[0]
        const jarak = kmTo(pos, nearest)
        // jauh dari Kaltim → jangan sok tahu
        if (jarak > 120) {
          setGeoNote(
            `Kamu sepertinya jauh dari Kaltim (±${Math.round(jarak)} km ke ${nearest.kode}) — pilih kota manual saja.`
          )
          return
        }
        setUserPos(pos)
        setKota(nearest.kota)
        setGeoNote(
          `Terdekat: ${nearest.kode} (±${jarak.toFixed(1)} km) — papan diurutkan dari yang paling dekat.`
        )
      },
      () =>
        setGeoNote(
          'Lokasi ditolak/diblokir — tidak masalah, pilih kota manual.'
        ),
      { timeout: 8000, maximumAge: 300_000 }
    )
  }

  const group = (k: Kota) => {
    const rows = CABANG.filter((c) => c.kota === k).map((c) => ({
      c,
      open: cardMenit !== null && isBuka(c, cardMenit),
      // ranking reads the REAL clock, never the scrubbed one: otherwise
      // dragging the hour slider re-sorts the board under your finger and the
      // cards jump around. The scrubber previews status, it doesn't re-rank.
      openNow: now !== null && isBuka(c, now),
      match: vibe ? c.cocok.includes(vibe) : true,
      km: userPos ? kmTo(userPos, c) : null,
    }))
    rows.sort(
      (a, b) =>
        Number(b.match) - Number(a.match) ||
        Number(b.openNow) - Number(a.openNow) ||
        (a.km ?? 9e9) - (b.km ?? 9e9)
    )
    const nearest = userPos
      ? rows.reduce((x, y) => ((x.km ?? 9e9) <= (y.km ?? 9e9) ? x : y))
      : null
    return { rows, nearest }
  }

  const pitCard = (
    { c, open, match, km }: ReturnType<typeof group>['rows'][number],
    near: boolean
  ) => {
    const j24 = c.buka === c.tutup
    const when =
      cardMenit === null || j24
        ? ''
        : open
          ? `· tutup ${hhmm(c.tutup)} — ${lagi(cardMenit, c.tutup)} lagi`
          : `· buka ${hhmm(c.buka)} — ${lagi(cardMenit, c.buka)} lagi`
    return (
      <article
        key={c.kode}
        className={cn(
          'sticker sticker-pop sticker-checker px-4 pt-0 pb-4 font-mono text-[0.78rem]',
          vibe &&
            (match
              ? 'outline-[3.5px] outline-offset-2 outline-amber'
              : 'opacity-45 grayscale-[0.4]')
        )}
      >
        <div className="font-display text-s1 italic">
          {c.kode}
          {km !== null && (
            <span className="ml-2 font-mono text-[0.7rem] font-normal text-ink-faint not-italic">
              ±{km < 10 ? km.toFixed(1) : Math.round(km)} km
            </span>
          )}
        </div>
        <div className="text-[0.66rem] tracking-[0.12em] text-ink-faint uppercase">
          {c.kota}
        </div>
        <div className="tempat mt-2 min-h-[2.4em] text-ink-soft">
          {c.tempat}
        </div>
        {/* Badges and countdown live on SEPARATE rows, and the countdown row
            reserves two lines. Otherwise dragging the hour scrubber changes
            the countdown's length ("9 jam 8 mnt lagi"), it wraps, every card
            grows ~27px, and the whole page jumps under your finger. */}
        <div className="mt-2.5 flex flex-wrap items-center gap-2 font-bold">
          <span
            aria-hidden="true"
            className={cn(
              'size-2.5 rounded-full',
              open ? 'bg-buka' : 'bg-tutup'
            )}
          />
          <span className={open ? 'text-buka' : 'text-tutup'}>
            {cardMenit === null ? '…' : open ? 'BUKA' : 'TUTUP'}
          </span>
          {near && (
            <span className="inline-block rotate-2 border-[1.5px] border-tinta bg-buka px-1.5 py-0.5 text-[0.6rem] tracking-[0.12em] text-white">
              TERDEKAT
            </span>
          )}
          {j24 && (
            <span className="inline-block -rotate-2 border-[1.5px] border-tinta bg-amber px-1.5 py-0.5 text-[0.6rem] tracking-[0.12em] text-tinta">
              24 JAM
            </span>
          )}
        </div>
        <div className="countdown mt-1 min-h-[2.6em] text-[0.72rem] leading-[1.3] text-ink-faint">
          {when}
        </div>
        {vibe && match && (
          <div className="why mt-2.5 min-h-[2.4em] border-l-4 border-amber bg-sunk py-1.5 pl-2.5 text-ink-soft">
            {VIBE_WHY[vibe](c)}
          </div>
        )}
        <div className="mt-2.5 flex flex-wrap gap-x-3 gap-y-1 text-[0.72rem] text-ink-faint">
          <span>📶 {c.wifi} Mbps</span>
          <span>🔌 {c.colokan}</span>
          <span>{c.suasana}</span>
        </div>
        <a
          className="peta mt-3 inline-block py-1 text-[0.7rem] font-bold tracking-[0.1em] text-biru uppercase decoration-amber"
          href={c.mapsUrl}
          target="_blank"
          rel="noreferrer"
        >
          Buka di Maps ↗
        </a>
      </article>
    )
  }

  const renderGroup = (k: Kota) => {
    const { rows, nearest } = group(k)
    return rows.map((r) => pitCard(r, r === nearest))
  }

  const kotaLain: Kota | null =
    kota === null ? null : kota === 'Balikpapan' ? 'Samarinda' : 'Balikpapan'
  const lain =
    kotaLain === null ? [] : CABANG.filter((c) => c.kota === kotaLain)

  return (
    <section
      className="wrap py-[clamp(2.6rem,6vw,4rem)]"
      id="buka"
      aria-labelledby="buka-h"
    >
      <Reveal>
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4 border-b-4 border-white pb-2.5">
          <h2 id="buka-h" className="text-s3">
            Mau ngapain <span className="script text-[0.6em]">malam ini?</span>
          </h2>
          <p className="eyebrow">pilih niatmu — papan menyusun ulang</p>
        </div>

        <div
          className="mb-1 flex flex-wrap gap-2"
          role="group"
          aria-label="Pilih kota"
        >
          {(['Balikpapan', 'Samarinda'] as const).map((k) => (
            <Button
              key={k}
              variant="chip"
              size="auto"
              aria-pressed={kota === k}
              onClick={() => setKota(kota === k ? null : k)}
            >
              {k}
            </Button>
          ))}
          <Button
            variant="chip"
            size="auto"
            aria-pressed={!!userPos}
            onClick={cari}
          >
            📍 Cari yang terdekat
          </Button>
        </div>
        <p className="geo-note m-0 min-h-[1.2em] font-mono text-[0.7rem] text-ink-faint">
          {geoNote}
        </p>

        <div
          className="my-4 flex flex-wrap gap-2"
          role="group"
          aria-label="Pilih niat"
        >
          {VIBES.map(([v, label]) => (
            <Button
              key={v}
              variant="chip"
              size="auto"
              aria-pressed={vibe === v}
              onClick={() => setVibe(vibe === v ? null : v)}
            >
              {label}
            </Button>
          ))}
        </div>

        <div className="board grid grid-cols-1 gap-4 min-[36rem]:grid-cols-2 min-[62rem]:grid-cols-3">
          {kota === null ? (
            (['Balikpapan', 'Samarinda'] as const).map((k) => (
              <div key={k} className="contents">
                <h3 className="city-head col-span-full mt-1.5 font-display text-s1 tracking-[0.05em] text-white italic">
                  {k} <span className="text-amber not-italic">●</span>
                </h3>
                {renderGroup(k)}
              </div>
            ))
          ) : (
            <>
              {renderGroup(kota)}
              <button
                type="button"
                className="other-city col-span-full min-h-11 cursor-pointer border-[2.5px] border-dashed border-white/55 bg-transparent px-4 py-3 text-left font-mono text-[0.78rem] font-bold text-white hover:border-amber hover:text-amber"
                onClick={() => setKota(kotaLain)}
              >
                Lagi di {kotaLain}? {lain.length} pit stop di sana (
                {menit === null
                  ? '…'
                  : lain.filter((c) => isBuka(c, menit)).length}{' '}
                buka) →
              </button>
            </>
          )}
        </div>

        <div className="scrub sticker mt-8 px-5 pt-4 pb-5">
          <div className="flex flex-wrap items-baseline justify-between gap-4">
            <p className="eyebrow m-0">
              Coba jam lain — papan &amp; suasana halaman ikut
            </p>
            <span className="scrub-clock font-display text-s2 text-biru italic tabular-nums">
              {menit === null ? '—.—' : hhmm(menit)}
            </span>
          </div>
          {/* step = 60: the scrubber answers "who's open at 3am", not "at
              3:07am" — so it moves in whole hours. That also drops a full drag
              from ~1440 possible re-renders to 24, which is what actually
              killed the lag (the deferred value above only softened it). */}
          <input
            type="range"
            min={0}
            max={1380}
            step={60}
            value={menit ?? 720}
            aria-label="Jam simulasi"
            onChange={(e) => onScrub(+e.target.value)}
          />
          <div className="flex justify-between font-mono text-[0.66rem] text-ink-faint">
            <span>00.00</span>
            <span>06.00</span>
            <span>12.00</span>
            <span>18.00</span>
            <span>23.00</span>
          </div>
          {scrubbed !== null && (
            <Button
              variant="chip"
              size="auto"
              className="mt-2"
              onClick={() => onScrub(null)}
            >
              ↺ Kembali ke sekarang
            </Button>
          )}
        </div>

        <p className="mt-6 max-w-160 border-l-4 border-amber pl-3.5 text-s-1 text-ink-soft">
          Papan ini dihitung langsung di browser dari jam buka tiap cabang —
          tanpa API, tanpa server. Balikpapan dan Samarinda tidak pernah
          dicampur dalam satu urutan: beda kota, beda rekomendasi.
        </p>
      </Reveal>
    </section>
  )
}
