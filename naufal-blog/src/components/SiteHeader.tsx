import { HeaderReading } from '@/components/HeaderReading'
import { Link } from '@/components/Link'
import { LocaleToggle } from '@/components/LocaleToggle'
import { MobileMenu } from '@/components/MobileMenu'
import { ThemeToggle } from '@/components/ThemeToggle'
import type { Locale } from '@/lib/i18n/config'
import type { Dictionary } from '@/lib/i18n/dictionaries'
import { HOST_URL } from '@/lib/site'

// Shared sticky chrome on every page: brand (left) + nav + locale/theme/reading
// (right). On >=sm those sit inline; on phones they collapse into the MobileMenu
// drawer so the header can't overflow. Hidden in print via `site-header` (cv.css).
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
          {/* Inline cluster on >=sm; on phones everything moves into the drawer. */}
          <div className="hidden items-center gap-3 sm:flex">
            {/* Back to the portfolio (the host) — external, so a plain anchor. */}
            <a
              href={HOST_URL}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              {dict.nav.portfolio}
            </a>
            <Link
              href={`/${lang}/posts`}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              {dict.nav.posts}
            </Link>
            <Link
              href={`/${lang}/cv`}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              {dict.nav.cv}
            </Link>
            <LocaleToggle current={lang} label={dict.locale.label} />
            <ThemeToggle labels={dict.theme} />
          </div>
          {/* Reading customizer — kept outside both the desktop cluster and the
              mobile drawer so it's reachable on phones without opening the
              hamburger. Self-gates to post-detail routes (renders null
              elsewhere); icon-only on phones, icon + label from sm up. */}
          <HeaderReading labels={dict.reading} />
          <MobileMenu lang={lang} dict={dict} />
        </nav>
      </div>
    </header>
  )
}
