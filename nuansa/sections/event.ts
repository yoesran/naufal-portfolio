import { CalendarDays } from 'lucide-react'

import { type ContentOf, f } from '@/lib/fields'
import { defineSection } from '@/lib/sections'

export const event = defineSection({
  id: 'event',
  label: 'Acara',
  Icon: CalendarDays,
  contract: {
    title: f.text('Judul', { placeholder: 'Akad Nikah & Resepsi' }),
    dayName: f.text('Hari', { placeholder: 'Minggu' }),
    date: f.date('Tanggal', { required: true }),
    time: f.text('Waktu', { placeholder: 'Pukul 08.00 WITA' }),
    venue: f.text('Nama tempat'),
    address: f.textarea('Alamat'),
    dresscode: f.text('Dresscode'),
  },
  defaultContent: {
    title: 'Akad Nikah & Resepsi',
    dayName: 'Minggu',
    date: '2026-11-13',
    time: 'Pukul 08.00 WITA',
    venue: 'Batakan Beach Club Village',
    address: 'Jl. Mulawarman, Manggar, Balikpapan',
    dresscode: 'Putih & Cream',
  },
})

export type EventContent = ContentOf<typeof event.contract>
