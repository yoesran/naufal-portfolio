import type { Locale } from '@/lib/i18n'

// Light lemmatization so the keyword matcher tolerates morphological variants
// ("written" → "write") instead of needing every form spelled out in a list.
// Applied to BOTH the query tokens and the keyword lists, so matching is set
// membership on a consistent stem (same input → same output — not a perfect
// canonical per word family, just consistent). Deliberately NOT applied to entity
// matching: proper nouns like "DBS" must stay intact — stripping the trailing "s"
// would break them.

// Irregular forms a suffix stripper can't reach, mapped onto a listed keyword's
// stem so the family collapses together.
const IRREGULAR: Record<Locale, Record<string, string>> = {
  en: {
    written: 'write',
    wrote: 'write',
    built: 'build',
    made: 'make',
    led: 'lead',
    taught: 'teach',
    knew: 'know',
    known: 'know',
    studied: 'study',
    studies: 'study',
  },
  id: {
    ditulis: 'tulis',
    menulis: 'tulis',
    tulisan: 'tulis',
    dibangun: 'bangun',
    membangun: 'bangun',
    dibuat: 'buat',
    membuat: 'buat',
  },
}

export function stem(token: string, locale: Locale): string {
  const irregular = IRREGULAR[locale][token]
  if (irregular) return irregular
  if (locale === 'en') {
    if (token.length > 4 && token.endsWith('ing')) return token.slice(0, -3)
    if (token.length > 4 && token.endsWith('ed')) return token.slice(0, -2)
    if (token.length > 3 && token.endsWith('es')) return token.slice(0, -2)
    if (token.length > 3 && token.endsWith('s') && !token.endsWith('ss'))
      return token.slice(0, -1)
    return token
  }
  // Indonesian: only the safest, most common clitics/suffixes — full affix
  // stemming is out of scope (entities carry most ID queries; see synonyms.ts).
  return token.replace(/(nya|kah|lah|pun)$/, '')
}

export const stemAll = (tokens: string[], locale: Locale): string[] =>
  tokens.map((t) => stem(t, locale))
