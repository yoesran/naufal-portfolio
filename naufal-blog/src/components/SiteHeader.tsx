import { Link } from '@/components/Link'
import { LocaleToggle } from '@/components/LocaleToggle'
import { MobileNav } from '@/components/MobileNav'
import { ThemeToggle } from '@/components/ThemeToggle'
import type { Locale } from '@/lib/i18n/config'
import type { Dictionary } from '@/lib/i18n/dictionaries'

// Shared sticky chrome on every page: brand (left) + nav + locale/theme toggles
// (right). Hidden in print via the `site-header` class (see cv.css).
export function SiteHeader({ lang, dict }: { lang: Locale; dict: Dictionary }) {
  return (
    <header className="site-header border-border/50 bg-background/80 sticky top-0 z-20 border-b backdrop-blur-md">
      <div className="mx-auto flex max-w-2xl items-center justify-between gap-2 px-4 py-3 font-mono text-sm sm:gap-3 sm:px-6">
        <Link
          href={`/${lang}`}
          className="text-foreground hover:text-brand font-medium transition-colors"
        >
          naufal.dev
        </Link>
        <nav className="flex items-center gap-2 sm:gap-3">
          {/* Inline text nav on >=sm; collapses into the MobileNav menu on phones
              to keep the toggles from overflowing. */}
          <Link
            href={`/${lang}/posts`}
            className="text-muted-foreground hover:text-foreground hidden transition-colors sm:inline"
          >
            {dict.nav.posts}
          </Link>
          <Link
            href={`/${lang}/cv`}
            className="text-muted-foreground hover:text-foreground hidden transition-colors sm:inline"
          >
            {dict.nav.cv}
          </Link>
          <LocaleToggle current={lang} label={dict.locale.label} />
          <ThemeToggle labels={dict.theme} />
          <MobileNav
            lang={lang}
            labels={{
              posts: dict.nav.posts,
              cv: dict.nav.cv,
              menu: dict.nav.menu,
            }}
          />
        </nav>
      </div>
    </header>
  )
}
