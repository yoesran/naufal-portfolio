import { defineShell } from '@/lib/shells'

import { KupuChrome } from './chrome'
import {
  Countdown,
  Couple,
  Cover,
  Event,
  Gift,
  Maps,
  Quotes,
  Thanks,
} from './renderers'

/**
 * Paged: one section per viewport, bottom tab bar. Note the absence of a
 * `gallery` renderer — a photo grid has nowhere to go in a single viewport, so
 * this shell simply cannot host that section. That absence is the whole
 * compatibility mechanism.
 */
export const kupuShell = defineShell({
  id: 'kupu',
  // Names the nav model, not the design — the editor already shows the preset name.
  name: 'Navigasi per bagian',
  Chrome: KupuChrome,
  renderers: {
    cover: Cover,
    quotes: Quotes,
    couple: Couple,
    event: Event,
    maps: Maps,
    countdown: Countdown,
    gift: Gift,
    thanks: Thanks,
  },
})
