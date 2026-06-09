import { initReactI18next } from 'react-i18next'

import i18n from 'i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

import en from './locales/en.json'
import id from './locales/id.json'

export const LOCALES = ['en', 'id'] as const
export type Locale = (typeof LOCALES)[number]
export const DEFAULT_LOCALE: Locale = 'en'

export function isLocale(value: string | undefined): value is Locale {
  return (LOCALES as readonly string[]).includes(value ?? '')
}

// The English locale shape is the source of truth for all translation keys.
// Components use this to derive specific key unions (e.g.
// `TechNoteKey = keyof Translations['techStack']['notes']`) so dynamic
// `t(`${prefix}.${dynamicKey}`)` calls don't need string casts.
export type Translations = typeof en

// `LocaleShape` widens every string leaf to `string` so cross-locale shape
// equality can be checked structurally. JSON imports are typed with literal
// values that necessarily differ per language — without this widening, every
// translated key would look "different" at the type level. Used below with
// `satisfies` to assert each non-default locale mirrors en's key structure.
type LocaleShape<T> = T extends string
  ? string
  : T extends object
    ? { [K in keyof T]: LocaleShape<T[K]> }
    : T

const asLocale = (value: string | undefined): Locale =>
  isLocale(value) ? value : DEFAULT_LOCALE

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      // Dual `satisfies` enforces locale shape consistency. Both directions
      // are needed because TS only runs excess-property checks on object
      // literals, not on JSON-import bindings.
      //
      // - Each non-default locale: `<locale> satisfies LocaleShape<typeof en>`
      //   catches missing keys in that locale (would silently fall back to
      //   English at runtime).
      // - `en` satisfies the intersection of `LocaleShape<typeof <each
      //   non-default locale>>` — catches extra keys in any of them (drift,
      //   would manifest as en lacking the key).
      //
      // Scaling rule: adding a 3rd locale (say `jp`) means
      //   en: { translation: en satisfies LocaleShape<typeof id> & LocaleShape<typeof jp> },
      //   id: { translation: id satisfies LocaleShape<typeof en> },
      //   jp: { translation: jp satisfies LocaleShape<typeof en> },
      // and adding `'jp'` to the LOCALES tuple above. Linear in N, not
      // quadratic, because en is the source of truth — every other locale
      // matches en, so they transitively match each other.
      en: { translation: en satisfies LocaleShape<typeof id> },
      id: { translation: id satisfies LocaleShape<typeof en> },
    },
    fallbackLng: DEFAULT_LOCALE,
    supportedLngs: LOCALES,
    interpolation: { escapeValue: false },
    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: 'locale',
      caches: ['localStorage'],
    },
  })

const syncHtmlLang = (lng: Locale) => {
  document.documentElement.lang = lng
}
syncHtmlLang(asLocale(i18n.resolvedLanguage))
i18n.on('languageChanged', (lng) => syncHtmlLang(asLocale(lng)))

export default i18n
