import { Images } from 'lucide-react'

import { type ContentOf, f } from '@/lib/fields'
import { defineSection } from '@/lib/sections'

/**
 * Vertical-only. A photo grid needs room to breathe and to be scrolled past;
 * the paged shell has no sensible way to show it in one viewport, so it simply
 * writes no renderer for it — that absence *is* the compatibility rule.
 */
export const gallery = defineSection({
  id: 'gallery',
  label: 'Galeri',
  Icon: Images,
  contract: {
    title: f.text('Judul', { placeholder: 'Galeri' }),
    photos: f.list(
      'Foto',
      f.group('Foto', { url: f.image('URL', { required: true }) }),
      { max: 12 }
    ),
  },
  defaultContent: {
    title: 'Galeri',
    photos: [],
  },
})

export type GalleryContent = ContentOf<typeof gallery.contract>
