import { Heart } from 'lucide-react'

import { type ContentOf, f } from '@/lib/fields'
import { defineSection } from '@/lib/sections'

export const couple = defineSection({
  id: 'couple',
  label: 'Mempelai',
  Icon: Heart,
  contract: {
    intro: f.textarea('Pembuka'),
    groom: f.group('Mempelai Pria', {
      name: f.text('Nama', { required: true }),
      parents: f.text('Anak dari'),
      photo: f.image('Foto'),
    }),
    bride: f.group('Mempelai Wanita', {
      name: f.text('Nama', { required: true }),
      parents: f.text('Anak dari'),
      photo: f.image('Foto'),
    }),
  },
  defaultContent: {
    intro:
      'Dengan rahmat Allah SWT, kami bermaksud mengundang Bapak/Ibu/Saudara/i dalam acara pernikahan putra-putri kami.',
    groom: {
      name: 'Renaldi',
      parents: 'Putra dari Bapak Wildan & Ibu Sari',
      photo: '',
    },
    bride: {
      name: 'Akmalina',
      parents: 'Putri dari Bapak Hendra & Ibu Ratna',
      photo: '',
    },
  },
})

export type CoupleContent = ContentOf<typeof couple.contract>
