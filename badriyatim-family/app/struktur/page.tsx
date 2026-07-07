import type { Metadata } from 'next'

import { CenterScroll } from '@/components/center-scroll'
import { PageHeading } from '@/components/page-heading'
import { struktur } from '@/lib/family'
import { cn } from '@/lib/utils'

export const metadata: Metadata = { title: 'Struktur' }

// Seksi (divisions) + their members, drawn from the program kerja.
const seksi = [
  { role: 'Seksi Pendidikan', members: ['Hidayati Munawarah'] },
  { role: 'Seksi Perekonomian', members: ['Andi Artha'] },
  { role: 'Seksi Kerohanian', members: ['Novera Elbarora'] },
  { role: 'Seksi Sosial Budaya', members: ['Moh. Iksan Yusal', 'Dina Hofty'] },
]

export default function StrukturPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <PageHeading
        eyebrow="Himpunan Keluarga"
        title="Struktur Organisasi"
        intro="Susunan pengurus Badriyatim Family yang menjalankan program keluarga."
      />

      <p className="text-tanah-soft mb-3 text-sm sm:hidden">
        Geser bagan ke samping untuk melihat semuanya.
      </p>

      {/* Rows stay horizontal; the chart scrolls sideways on small screens and
          starts centred on the trunk. The edge fades make the mid-word card
          clipping read as "more this way", not breakage — worst at A++, where
          a two-card row is wider than any phone. */}
      <div className="relative">
        <div
          aria-hidden="true"
          className="from-gading pointer-events-none absolute inset-y-0 left-0 z-10 w-6 bg-linear-to-r to-transparent sm:hidden"
        />
        <div
          aria-hidden="true"
          className="from-gading pointer-events-none absolute inset-y-0 right-0 z-10 w-6 bg-linear-to-l to-transparent sm:hidden"
        />
        <CenterScroll className="overflow-x-auto pb-2">
          <div className="mx-auto w-max px-2">
            <div className="flex justify-center">
              <Unit
                role="Penasehat"
                name={struktur.penasehat}
                wakilRole="Wakil Penasehat"
                wakil={struktur.wakil_penasehat}
              />
            </div>

            <div className="org-trunk" aria-hidden="true" />
            <div className="flex justify-center">
              <Unit role="Ketua" name={struktur.ketua} highlight />
            </div>

            <div className="org-trunk" aria-hidden="true" />
            <div className="org-branch">
              <Unit role="Wakil Ketua I" name={struktur.wakil_ketua_1} />
              <Unit role="Wakil Ketua II" name={struktur.wakil_ketua_2} />
            </div>

            <div className="org-trunk" aria-hidden="true" />
            <div className="org-branch">
              <Unit
                role="Sekretaris"
                name={struktur.sekretaris}
                wakilRole="Wakil Sekretaris"
                wakil={struktur.wakil_sekretaris}
              />
              <Unit
                role="Bendahara"
                name={struktur.bendahara}
                wakilRole="Wakil Bendahara"
                wakil={struktur.wakil_bendahara}
              />
            </div>

            <div className="org-trunk" aria-hidden="true" />
            <div className="org-branch">
              {seksi.map((s) => (
                <SeksiCard key={s.role} role={s.role} members={s.members} />
              ))}
            </div>
          </div>
        </CenterScroll>
      </div>
    </div>
  )
}

// A pengurus unit: the principal card, plus the wakil as a separate card wired
// directly below it.
function Unit({
  role,
  name,
  wakil,
  wakilRole,
  highlight,
}: {
  role: string
  name: string
  wakil?: string
  wakilRole?: string
  highlight?: boolean
}) {
  return (
    <div className="flex flex-col items-center">
      <RoleCard role={role} name={name} highlight={highlight} />
      {wakil && (
        <>
          <div className="bg-emas/55 h-4 w-px" aria-hidden="true" />
          <RoleCard role={wakilRole ?? 'Wakil'} name={wakil} muted />
        </>
      )}
    </div>
  )
}

function RoleCard({
  role,
  name,
  highlight,
  muted,
}: {
  role: string
  name: string
  highlight?: boolean
  muted?: boolean
}) {
  return (
    <div
      className={cn(
        'w-40 rounded-xl border p-3.5 text-center shadow-sm sm:w-44',
        highlight
          ? 'border-marun bg-marun text-gading'
          : muted
            ? 'border-border bg-gading-warm'
            : 'border-border bg-card'
      )}
    >
      <p
        className={cn(
          'text-xs font-semibold tracking-wide uppercase',
          highlight ? 'text-emas-light' : 'text-marun-soft'
        )}
      >
        {role}
      </p>
      <p
        className={cn(
          'font-heading mt-1 leading-tight font-semibold',
          highlight ? 'text-gading' : 'text-tanah'
        )}
      >
        {name}
      </p>
    </div>
  )
}

function SeksiCard({ role, members }: { role: string; members: string[] }) {
  return (
    <div className="border-border bg-card w-40 rounded-xl border p-3.5 text-center shadow-sm sm:w-44">
      <p className="text-marun-soft text-xs font-semibold tracking-wide uppercase">
        {role}
      </p>
      <ul className="mt-1 space-y-0.5">
        {members.map((m) => (
          <li
            key={m}
            className="font-heading text-tanah leading-tight font-semibold"
          >
            {m}
          </li>
        ))}
      </ul>
    </div>
  )
}
