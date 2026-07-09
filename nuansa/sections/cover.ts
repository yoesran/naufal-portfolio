import { Home } from 'lucide-react'

import { type ContentOf, f } from '@/lib/fields'
import { defineSection } from '@/lib/sections'

export const cover = defineSection({
  id: 'cover',
  label: 'Sampul',
  Icon: Home,
  contract: {
    heading: f.text('Judul atas', { placeholder: 'The Wedding Of' }),
    person1: f.text('Nama mempelai pria', { required: true }),
    person2: f.text('Nama mempelai wanita', { required: true }),
    tagline: f.text('Kalimat undangan'),
    guestLabel: f.text('Sapaan tamu', {
      placeholder: 'Kepada Yth: Bapak/Ibu/Saudara/i',
    }),
  },
  defaultContent: {
    heading: 'The Wedding Of',
    person1: 'Renaldi',
    person2: 'Akmalina',
    tagline: 'Kami mengundang anda untuk merayakan hari bahagia kami',
    guestLabel: 'Kepada Yth: Bapak/Ibu/Saudara/i',
  },
})

export type CoverContent = ContentOf<typeof cover.contract>
