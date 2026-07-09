import type { TemplatePreset } from '@/lib/site'

/**
 * Templates are presets, not code: a shell plus a starting section order.
 * Adding one is a few lines here. Adding a *design* means writing a shell;
 * adding a *content block* means writing a section.
 */
export const TEMPLATES: Record<string, TemplatePreset> = {
  kupu: {
    id: 'kupu',
    name: 'Kupu',
    description:
      'Undangan bernuansa biru — ornamen botani, satu bagian per layar dengan navigasi bawah.',
    shellId: 'kupu',
    sections: [
      'cover',
      'quotes',
      'couple',
      'event',
      'maps',
      'countdown',
      'gift',
      'thanks',
    ],
  },

  alur: {
    id: 'alur',
    name: 'Alur',
    description:
      'Undangan bernuansa hangat — gulir vertikal, tipografi editorial, dengan galeri foto.',
    shellId: 'alur',
    sections: [
      'cover',
      'quotes',
      'couple',
      'event',
      'gallery',
      'maps',
      'countdown',
      'gift',
      'thanks',
    ],
  },
}
