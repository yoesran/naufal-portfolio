import { useTranslation } from 'react-i18next'

import { LocaleToggle } from '@/components/LocaleToggle'
import { ThemeToggle } from '@/components/ThemeToggle'

export function Header() {
  const { t } = useTranslation()
  const nav = [
    { label: t('header.nav.work'), href: '#' },
    { label: t('header.nav.blog'), href: '#' },
    { label: t('header.nav.cv'), href: '#' },
  ]

  return (
    <header className="border-border/50 bg-background/80 sticky top-0 z-50 border-b backdrop-blur-md">
      <div className="mx-auto flex max-w-2xl items-center justify-between px-6 py-3">
        <a
          href="/"
          className="text-foreground font-mono text-sm font-medium transition-colors hover:text-emerald-300"
        >
          naufal.dev
        </a>
        <nav className="flex items-center gap-5 font-mono text-xs">
          {nav.map((item) => (
            <a
              key={item.label}
              href={item.href}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              {item.label}
            </a>
          ))}
          <LocaleToggle />
          <ThemeToggle />
        </nav>
      </div>
    </header>
  )
}
