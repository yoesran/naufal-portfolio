import { SITE_URL } from '@/lib/site'

import { type Locale, locales } from './config'

// Build canonical + hreflang `languages` for a page so each locale URL points at
// its siblings. `subpath` is the path after the locale, e.g. "posts" or "cv".
export function alternates(lang: Locale, subpath = '') {
  const tail = subpath ? `/${subpath}` : ''
  return {
    canonical: `${SITE_URL}/${lang}${tail}`,
    languages: Object.fromEntries(
      locales.map((l) => [l, `${SITE_URL}/${l}${tail}`])
    ) as Record<Locale, string>,
  }
}
