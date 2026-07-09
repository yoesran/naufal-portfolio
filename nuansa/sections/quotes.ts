import { Quote } from 'lucide-react'

import { type ContentOf, f } from '@/lib/fields'
import { defineSection } from '@/lib/sections'

export const quotes = defineSection({
  id: 'quotes',
  label: 'Kutipan',
  Icon: Quote,
  contract: {
    text: f.textarea('Isi kutipan'),
    source: f.text('Sumber'),
  },
  defaultContent: {
    text: 'Di antara tanda-tanda (kebesaran)-Nya ialah Dia menciptakan pasangan-pasangan untukmu dari jenismu sendiri, agar kamu cenderung dan merasa tenteram kepadanya.',
    source: 'QS. Ar-Rum 21',
  },
})

export type QuotesContent = ContentOf<typeof quotes.contract>
