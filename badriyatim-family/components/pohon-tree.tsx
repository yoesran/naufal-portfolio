'use client'

import { useState } from 'react'

import { ChevronRight } from 'lucide-react'

import { type Profile, ProfileDialog } from '@/components/profile-dialog'
import { Button } from '@/components/ui/button'
import type { Silsila } from '@/lib/family'
import { cn } from '@/lib/utils'

// The accessible list view: an indented tree (mobile-first) where every name
// opens a profile. PUBLIC-SAFE BY CONSTRUCTION — it reads only the silsilah
// (names + relationships); no contact/address/DOB data is imported here, so none
// can reach the public bundle. Richer fields (work, photo, hobby) live in the
// members-only area later. Keys use indices, since some cucu share a number.
export function PohonTree({ silsila }: { silsila: Silsila }) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [profile, setProfile] = useState<Profile | null>(null)
  const root = `${silsila.root.ayah} & ${silsila.root.ibu}`

  const toggle = (id: string) =>
    setExpanded((s) => {
      const n = new Set(s)
      if (n.has(id)) n.delete(id)
      else n.add(id)
      return n
    })

  return (
    <div>
      <div className="border-marun bg-marun text-gading rounded-xl border-2 px-6 py-5 text-center">
        <p className="text-emas-light text-xs font-semibold tracking-wide uppercase">
          Cikal bakal
        </p>
        <p className="font-heading mt-1 text-xl font-semibold">
          {silsila.root.ayah}
        </p>
        <p className="font-heading text-xl font-semibold">
          &amp; {silsila.root.ibu}
        </p>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Button
          variant="outline"
          className="min-h-11"
          onClick={() =>
            setExpanded(
              new Set(
                silsila.anak.flatMap((a, ai) => [
                  `a${ai}`,
                  ...a.cucu.map((_, ci) => `a${ai}-c${ci}`),
                ])
              )
            )
          }
        >
          Buka semua
        </Button>
        <Button
          variant="outline"
          className="min-h-11"
          onClick={() => setExpanded(new Set())}
        >
          Tutup semua
        </Button>
        <p className="text-tanah-soft text-sm">
          Ketuk nama untuk lihat profil.
        </p>
      </div>

      <ul className="border-emas/40 mt-4 space-y-1 border-l-2 pl-3">
        {silsila.anak.map((a, ai) => {
          const id = `a${ai}`
          const open = expanded.has(id)
          return (
            <li key={id}>
              <Row
                name={a.nama}
                meta={`${a.cucu.length} cucu`}
                emphasis
                hasChildren={a.cucu.length > 0}
                open={open}
                onToggle={() => toggle(id)}
                onSelect={() =>
                  setProfile({
                    nama: a.nama,
                    relasi: `Anak ke-${a.no} dari ${root}`,
                    pasangan: a.pasangan,
                    childrenLabel: 'Cucu',
                    children: a.cucu.map((c) => c.nama),
                  })
                }
              />
              {open && a.cucu.length > 0 && (
                <ul className="border-emas/25 mt-1 space-y-1 border-l-2 pl-3">
                  {a.cucu.map((c, ci) => {
                    const cid = `a${ai}-c${ci}`
                    const copen = expanded.has(cid)
                    return (
                      <li key={cid}>
                        <Row
                          name={c.nama}
                          meta={
                            c.cicit.length
                              ? `${c.cicit.length} cicit`
                              : undefined
                          }
                          hasChildren={c.cicit.length > 0}
                          open={copen}
                          onToggle={() => toggle(cid)}
                          onSelect={() =>
                            setProfile({
                              nama: c.nama,
                              relasi: `Cucu — anak dari ${a.nama}`,
                              pasangan: c.pasangan,
                              catatan: c.catatan,
                              childrenLabel: 'Cicit',
                              children: c.cicit,
                            })
                          }
                        />
                        {copen && c.cicit.length > 0 && (
                          <ul className="mt-1.5 flex flex-wrap gap-1.5 pl-3">
                            {c.cicit.map((name, ii) => (
                              <li key={`${cid}-i${ii}`}>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setProfile({
                                      nama: name,
                                      relasi: `Cicit — anak dari ${c.nama}`,
                                    })
                                  }
                                  className="bg-emas-pale text-marun-deep hover:bg-emas-light inline-flex min-h-11 items-center rounded-full px-3 py-1 text-xs font-medium sm:min-h-0 sm:px-2.5"
                                >
                                  {name}
                                </button>
                              </li>
                            ))}
                          </ul>
                        )}
                      </li>
                    )
                  })}
                </ul>
              )}
            </li>
          )
        })}
      </ul>

      <ProfileDialog profile={profile} onClose={() => setProfile(null)} />
    </div>
  )
}

function Row({
  name,
  meta,
  emphasis,
  hasChildren,
  open,
  onToggle,
  onSelect,
}: {
  name: string
  meta?: string
  emphasis?: boolean
  hasChildren: boolean
  open: boolean
  onToggle: () => void
  onSelect: () => void
}) {
  return (
    <div className="flex items-center gap-1">
      {hasChildren ? (
        <button
          type="button"
          onClick={onToggle}
          aria-label={open ? `Tutup cabang ${name}` : `Buka cabang ${name}`}
          aria-expanded={open}
          className="text-tanah-soft hover:bg-gading-deep flex size-11 flex-none items-center justify-center rounded-md sm:size-8"
        >
          <ChevronRight
            className={cn('size-4 transition-transform', open && 'rotate-90')}
          />
        </button>
      ) : (
        <span className="size-11 flex-none sm:size-8" aria-hidden="true" />
      )}
      <button
        type="button"
        onClick={onSelect}
        className={cn(
          // 44px rows on touch, compact on desktop where the pointer is precise.
          'hover:bg-gading-deep flex min-h-11 flex-1 items-center gap-2 rounded-md px-2 py-1.5 text-left transition-colors sm:min-h-9',
          emphasis ? 'font-heading text-marun font-semibold' : 'text-tanah'
        )}
      >
        <span>{name}</span>
        {meta && (
          <span className="text-tanah-soft text-xs font-normal">· {meta}</span>
        )}
      </button>
    </div>
  )
}
