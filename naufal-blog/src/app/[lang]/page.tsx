import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { Link } from '@/components/Link'
import { alternates } from '@/lib/i18n/alternates'
import { isLocale } from '@/lib/i18n/config'
import { getDictionary } from '@/lib/i18n/dictionaries'
import { HOST_URL } from '@/lib/site'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>
}): Promise<Metadata> {
  const { lang } = await params
  if (!isLocale(lang)) return {}
  const dict = getDictionary(lang)
  return {
    title: { absolute: dict.meta.siteTitle },
    alternates: alternates(lang),
  }
}

export default async function Home({
  params,
}: {
  params: Promise<{ lang: string }>
}) {
  const { lang } = await params
  if (!isLocale(lang)) notFound()
  const dict = getDictionary(lang)

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center px-6 py-16">
      <p className="text-brand font-mono text-sm">naufal.dev</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
        {dict.home.name}
      </h1>
      <p className="text-muted-foreground mt-4 text-lg leading-relaxed">
        {dict.home.intro}{' '}
        <a
          href={HOST_URL}
          className="text-foreground hover:text-brand underline underline-offset-4 transition-colors"
        >
          {dict.home.portfolioLink}
        </a>
        .
      </p>
      {/* In-page links into the two sections — the header is the nav landmark
          (a phone menu on small screens), so these stay plain content links to
          avoid a second, unlabeled navigation landmark; they keep Posts/CV
          visible in the body on every device. */}
      <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 font-mono text-sm">
        <Link
          href={`/${lang}/posts`}
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          {dict.nav.posts} →
        </Link>
        <Link
          href={`/${lang}/cv`}
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          {dict.nav.cv} →
        </Link>
      </div>
    </main>
  )
}
