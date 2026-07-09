import { MapPin } from 'lucide-react'

import { type ContentOf, f } from '@/lib/fields'
import { defineSection } from '@/lib/sections'

export const maps = defineSection({
  id: 'maps',
  label: 'Lokasi',
  Icon: MapPin,
  contract: {
    label: f.text('Nama lokasi'),
    address: f.textarea('Alamat lengkap'),
    url: f.text('Link Google Maps'),
  },
  defaultContent: {
    label: 'Batakan Beach Club Village',
    address: 'Jl. Mulawarman, Manggar, Balikpapan, Kalimantan Timur 76116',
    url: 'https://maps.google.com/?q=Batakan+Beach+Club+Village',
  },
})

export type MapsContent = ContentOf<typeof maps.contract>
