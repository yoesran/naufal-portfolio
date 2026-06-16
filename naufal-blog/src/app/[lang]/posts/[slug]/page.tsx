import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { Link } from '@/components/Link'
import { alternates } from '@/lib/i18n/alternates'
import { type Locale, isLocale } from '@/lib/i18n/config'
import { getDictionary } from '@/lib/i18n/dictionaries'
import { getPost, posts } from '@/lib/posts'
import { HOST_URL, SITE_URL } from '@/lib/site'

import './reading.css'

export function generateStaticParams() {
  return posts.map((post) => ({ slug: post.slug }))
}

export const dynamicParams = false

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>
}): Promise<Metadata> {
  const { lang, slug } = await params
  if (!isLocale(lang)) return {}
  const post = getPost(slug)
  if (!post) return {}
  // Per-post OpenGraph/Twitter. Without these the post page would inherit the
  // [lang] layout's site-level card wholesale (Next merges metadata shallowly:
  // a child that omits `openGraph` inherits the parent's), so a shared link
  // would show the generic site title + `type: website` instead of the post.
  const url = `${SITE_URL}/${lang}/posts/${slug}`
  const title = post.title[lang]
  const description = post.description[lang]
  return {
    title,
    description,
    alternates: alternates(lang, `posts/${slug}`),
    openGraph: {
      type: 'article',
      title,
      description,
      url,
      siteName: 'Naufal Yusran',
      locale: lang,
      publishedTime: post.date,
      authors: ['Naufal Yusran'],
      images: [{ url: '/og.png', width: 1200, height: 630 }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ['/og.png'],
    },
  }
}

export default async function PostPage({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>
}) {
  const { lang, slug } = await params
  if (!isLocale(lang)) notFound()
  const post = getPost(slug)
  if (!post) notFound()

  const dict = getDictionary(lang)
  const { default: Body } = await import(`@/content/${lang}/${slug}.mdx`)
  const dateFmt = new Intl.DateTimeFormat(lang, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  // BlogPosting structured data — lets search engines read the post as an
  // article (title, date, author, language) rather than inferring it.
  const url = `${SITE_URL}/${lang}/posts/${slug}`
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title[lang],
    description: post.description[lang],
    datePublished: post.date,
    inLanguage: lang,
    url,
    mainEntityOfPage: url,
    author: { '@type': 'Person', name: 'Naufal Yusran', url: HOST_URL },
  }

  return (
    <main
      id="content"
      tabIndex={-1}
      className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-6 py-16 focus:outline-none"
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Link
        href={`/${lang}/posts`}
        className="text-muted-foreground hover:text-foreground font-mono text-sm transition-colors"
      >
        {dict.post.back}
      </Link>

      <header className="mt-8">
        <time
          className="text-muted-foreground font-mono text-xs"
          dateTime={post.date}
        >
          {dateFmt.format(new Date(post.date))}
        </time>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
          {post.title[lang as Locale]}
        </h1>
      </header>

      <div id="reading" className="mt-10">
        <article className="prose post-prose max-w-none">
          <Body />
        </article>
      </div>
    </main>
  )
}
