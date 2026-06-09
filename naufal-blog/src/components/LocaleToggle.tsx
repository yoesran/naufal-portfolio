'use client'

import { usePathname, useRouter } from 'next/navigation'

import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { type Locale, isLocale, localeNames, locales } from '@/lib/i18n/config'

// Mirrors naufal-host's LocaleToggle (shadcn ToggleGroup, single-select via
// value={[current]} + onValueChange→next[0]); the host changes i18n state, the
// blog navigates to the locale route. Locale discovery for SEO is handled by the
// per-page hreflang alternates + sitemap, so real buttons (not anchors) are fine.
export function LocaleToggle({
  current,
  label,
}: {
  current: Locale
  label: string
}) {
  const pathname = usePathname() ?? `/${current}`
  const router = useRouter()

  function pathFor(locale: Locale): string {
    const parts = pathname.split('/')
    parts[1] = locale // parts[0] is "" (leading slash), parts[1] the locale
    return parts.join('/') || `/${locale}`
  }

  return (
    <ToggleGroup
      value={[current]}
      onValueChange={(next: string[]) => {
        const v = next[0]
        if (v && isLocale(v) && v !== current) router.push(pathFor(v))
      }}
      spacing={0}
      size="sm"
      variant="outline"
      aria-label={label}
    >
      {locales.map((locale) => (
        <ToggleGroupItem
          key={locale}
          value={locale}
          aria-label={localeNames[locale]}
          className="text-muted-foreground data-[state=on]:text-foreground text-xs font-medium"
        >
          {localeNames[locale]}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  )
}
