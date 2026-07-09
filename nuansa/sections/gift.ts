import { Gift } from 'lucide-react'

import { type ContentOf, f } from '@/lib/fields'
import { defineSection } from '@/lib/sections'

export const gift = defineSection({
  id: 'gift',
  label: 'Hadiah',
  Icon: Gift,
  contract: {
    note: f.textarea('Catatan'),
    accounts: f.list(
      'Rekening',
      f.group('Rekening', {
        bank: f.text('Bank', { required: true, placeholder: 'BCA' }),
        number: f.text('Nomor rekening', { required: true }),
        holder: f.text('Atas nama', { required: true }),
      }),
      { max: 3 }
    ),
  },
  defaultContent: {
    note: 'Doa restu anda adalah hadiah terindah. Namun bila ingin memberi tanda kasih, silakan melalui rekening berikut.',
    accounts: [
      { bank: 'BCA', number: '1234567890', holder: 'Renaldi' },
      { bank: 'Mandiri', number: '0987654321', holder: 'Akmalina' },
    ],
  },
})

export type GiftContent = ContentOf<typeof gift.contract>
