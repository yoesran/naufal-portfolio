import { useTranslation } from 'react-i18next'

import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { DEFAULT_LOCALE, LOCALES, type Locale, isLocale } from '@/lib/i18n'

const ITEM_CLASS =
  'text-muted-foreground data-[state=on]:text-foreground h-6 min-w-6 px-1.5 font-mono text-[10px] font-medium'

export function LocaleToggle() {
  const { i18n, t } = useTranslation()
  const current: Locale = isLocale(i18n.resolvedLanguage)
    ? i18n.resolvedLanguage
    : DEFAULT_LOCALE

  return (
    <ToggleGroup
      value={[current]}
      onValueChange={(next: string[]) => {
        const v = next[0]
        if (v && isLocale(v) && v !== current) void i18n.changeLanguage(v)
      }}
      spacing={0}
      aria-label={t('locale.toggleLabel')}
      className="h-6"
    >
      {LOCALES.map((locale) => (
        <ToggleGroupItem key={locale} value={locale} className={ITEM_CLASS}>
          {locale.toUpperCase()}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  )
}
