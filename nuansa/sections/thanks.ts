import { Check } from 'lucide-react'

import { type ContentOf, f } from '@/lib/fields'
import { defineSection } from '@/lib/sections'

export const thanks = defineSection({
  id: 'thanks',
  label: 'Penutup',
  Icon: Check,
  contract: {
    greeting: f.text('Salam'),
    message: f.textarea('Pesan'),
    signature: f.text('Tanda tangan'),
  },
  defaultContent: {
    greeting: "Wassalamu'alaikum Warahmatullahi Wabarakatuh",
    message:
      'Merupakan suatu kebahagiaan dan kehormatan bagi kami apabila Bapak/Ibu/Saudara/i berkenan hadir dan memberikan doa restu kepada kedua mempelai.',
    signature: 'Renaldi & Akmalina',
  },
})

export type ThanksContent = ContentOf<typeof thanks.contract>
