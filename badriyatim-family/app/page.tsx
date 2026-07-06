import Link from 'next/link'

import { ArrowRight } from 'lucide-react'

import { Gonjong } from '@/components/gonjong'
import { Card } from '@/components/ui/card'
import { counts, programKerja } from '@/lib/family'
import { SITE } from '@/lib/site'

const gateways = [
  {
    href: '/silsilah',
    title: 'Silsilah',
    desc: 'Pohon keluarga dari Badriyatim & Anizir hingga para cicit.',
  },
  {
    href: '/struktur',
    title: 'Struktur',
    desc: 'Susunan pengurus himpunan keluarga besar.',
  },
  {
    href: '/tentang',
    title: 'Tentang',
    desc: 'Kisah dan tujuan himpunan keluarga besar.',
  },
]

export default function Home() {
  const pulang = programKerja.find((p) =>
    p.nama_kegiatan.includes('PULANG BASAMO')
  )

  return (
    <div>
      <section className="border-border border-b">
        <div className="mx-auto max-w-5xl px-4 py-16 text-center sm:py-24">
          <Gonjong
            className="text-emas mx-auto w-24 sm:w-32"
            label="Rumah gadang"
          />
          <h1 className="font-heading text-marun mt-6 text-4xl font-semibold sm:text-6xl">
            {SITE.name}
          </h1>
          <p className="text-tanah-soft mx-auto mt-4 max-w-2xl text-lg">
            {SITE.tagline}
          </p>
          <p className="text-tanah-soft/80 mt-1">{SITE.roots}</p>

          <div className="border-emas/40 bg-gading-warm text-marun mx-auto mt-8 flex max-w-xl flex-wrap items-center justify-center gap-x-3 gap-y-2 rounded-full border px-5 py-3 text-sm font-medium">
            <Stat n={counts.anak} label="anak" />
            <Dot />
            <Stat n={counts.cucu} label="cucu" />
            <Dot />
            <Stat n={counts.cicit} label="cicit" />
            <Dot />
            <Stat n={counts.anggota} label="anggota terdata" />
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-5xl px-4 py-12">
        {pulang && (
          <Card className="border-marun/20 bg-marun text-gading mb-10 gap-2 p-6">
            <p className="text-emas-light text-sm font-semibold tracking-wide uppercase">
              Agenda utama · {pulang.waktu}
            </p>
            <h2 className="font-heading text-gading text-2xl font-semibold">
              Pulang Basamo
            </h2>
            <p className="text-gading/85 max-w-2xl">
              Memperkenalkan tanah leluhur kepada anak cucu, khususnya yang di
              rantau — sekalian peresmian rumah di kampung.
            </p>
          </Card>
        )}

        <div className="grid gap-4 sm:grid-cols-3">
          {gateways.map((g) => (
            <Link key={g.href} href={g.href} className="group">
              <Card className="group-hover:border-emas h-full gap-2 p-6 transition-colors">
                <div className="flex items-center justify-between">
                  <h3 className="font-heading text-marun text-xl font-semibold">
                    {g.title}
                  </h3>
                  <ArrowRight className="text-emas size-5 transition-transform group-hover:translate-x-0.5" />
                </div>
                <p className="text-tanah-soft">{g.desc}</p>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}

function Stat({ n, label }: { n: number; label: string }) {
  return (
    <span>
      <span className="font-heading text-base font-bold">{n}</span> {label}
    </span>
  )
}

function Dot() {
  return (
    <span className="text-emas" aria-hidden>
      ·
    </span>
  )
}
