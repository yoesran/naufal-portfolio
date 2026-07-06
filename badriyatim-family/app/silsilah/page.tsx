import type { Metadata } from 'next'

import { PageHeading } from '@/components/page-heading'
import { SilsilahView } from '@/components/silsilah-view'
import { counts, silsila } from '@/lib/family'

export const metadata: Metadata = { title: 'Silsilah' }

export default function SilsilahPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <PageHeading
        eyebrow="Pohon Keluarga"
        title="Silsilah"
        intro={`Keturunan Badriyatim & Anizir — ${counts.anak} anak, ${counts.cucu} cucu, dan ${counts.cicit} cicit, terjalin seperti benang songket.`}
      />
      <SilsilahView silsila={silsila} />
    </div>
  )
}
