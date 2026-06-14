'use client'

import { usePathname } from 'next/navigation'

import { Link } from '@/components/Link'
import { defaultLocale, isLocale } from '@/lib/i18n/config'
import { getDictionary } from '@/lib/i18n/dictionaries'

// Localized 404 for notFound() thrown inside a locale (e.g. an unknown post
// slug). Reads the locale from the path since not-found gets no params.
export default function LocalizedNotFound() {
  const pathname = usePathname() ?? '/'
  const seg = pathname.split('/')[1] ?? ''
  const lang = isLocale(seg) ? seg : defaultLocale
  const dict = getDictionary(lang)

  const links: [string, string][] = [
    [`/${lang}`, dict.notFound.home],
    [`/${lang}/posts`, dict.nav.posts],
    [`/${lang}/cv`, dict.nav.cv],
  ]

  return (
    <main
      id="content"
      tabIndex={-1}
      className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center px-6 py-16 focus:outline-none"
    >
      <p className="text-brand font-mono text-sm">404</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
        {dict.notFound.title}
      </h1>
      <p className="text-muted-foreground mt-4 text-lg leading-relaxed">
        {dict.notFound.body}
      </p>
      <nav className="mt-8 flex gap-5 font-mono text-sm">
        {links.map(([href, label]) => (
          <Link
            key={href}
            href={href}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            {label}
          </Link>
        ))}
      </nav>
    </main>
  )
}
