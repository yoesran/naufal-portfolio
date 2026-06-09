import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { SiteHeader } from '@/components/SiteHeader'
import { alternates } from '@/lib/i18n/alternates'
import { type Locale, isLocale, locales } from '@/lib/i18n/config'
import { getDictionary } from '@/lib/i18n/dictionaries'
import { SITE_URL } from '@/lib/site'

// Nested under the root layout (which owns <html>/<body>). This one only adds
// the locale chrome + per-locale metadata; keeping <html> out of here means a
// locale switch doesn't re-render it (see ../layout.tsx).
export function generateStaticParams() {
  return locales.map((lang) => ({ lang }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>
}): Promise<Metadata> {
  const { lang } = await params
  if (!isLocale(lang)) return {}
  const dict = getDictionary(lang)
  return {
    metadataBase: new URL(SITE_URL),
    title: {
      default: dict.meta.siteTitle,
      template: '%s — Naufal Yusran',
    },
    description: dict.meta.siteDescription,
    alternates: alternates(lang),
    openGraph: {
      type: 'website',
      siteName: 'Naufal Yusran',
      title: dict.meta.siteTitle,
      description: dict.meta.siteDescription,
      url: `${SITE_URL}/${lang}`,
      locale: lang,
      images: [{ url: '/og.png', width: 1200, height: 630 }],
    },
    twitter: {
      card: 'summary_large_image',
      title: dict.meta.siteTitle,
      description: dict.meta.siteDescription,
      images: ['/og.png'],
    },
  }
}

export default async function LangLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ lang: string }>
}) {
  const { lang } = await params
  if (!isLocale(lang)) notFound()
  const dict = getDictionary(lang as Locale)

  return (
    <>
      <SiteHeader lang={lang as Locale} dict={dict} />
      {children}
    </>
  )
}
