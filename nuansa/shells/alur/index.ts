import { defineShell } from '@/lib/shells'

import { AlurChrome } from './chrome'
import {
  Countdown,
  Couple,
  Cover,
  Event,
  Gallery,
  Gift,
  Maps,
  Quotes,
  Thanks,
} from './renderers'

/** Vertical scroll — hosts every section, including the gallery Kupu can't. */
export const alurShell = defineShell({
  id: 'alur',
  name: 'Gulir vertikal',
  Chrome: AlurChrome,
  renderers: {
    cover: Cover,
    quotes: Quotes,
    couple: Couple,
    event: Event,
    maps: Maps,
    countdown: Countdown,
    gallery: Gallery,
    gift: Gift,
    thanks: Thanks,
  },
})
