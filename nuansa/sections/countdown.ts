import { Hourglass } from 'lucide-react'

import { type ContentOf, f } from '@/lib/fields'
import { defineSection } from '@/lib/sections'

// Self-contained on purpose: it carries its own target date rather than reading
// the event section, so reordering or removing `event` can never break it.
export const countdown = defineSection({
  id: 'countdown',
  label: 'Hitung Mundur',
  Icon: Hourglass,
  contract: {
    title: f.text('Judul', { placeholder: 'Menghitung Hari' }),
    targetDate: f.date('Tanggal acara', { required: true }),
  },
  defaultContent: { title: 'Menghitung Hari', targetDate: '2026-11-13' },
})

export type CountdownContent = ContentOf<typeof countdown.contract>
