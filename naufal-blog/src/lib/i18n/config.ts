// Locale config shared by server (routing, dictionaries) and client (toggle).
// No server-only imports here so client components can use the types/helpers.
export const locales = ['en', 'id'] as const
export type Locale = (typeof locales)[number]

export const defaultLocale: Locale = 'en'

export const localeNames: Record<Locale, string> = {
  en: 'EN',
  id: 'ID',
}

export function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value)
}
