import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { Link } from '@/components/Link'
import { ReadingPanel } from '@/components/ReadingPanel'
import { alternates } from '@/lib/i18n/alternates'
import { type Locale, isLocale } from '@/lib/i18n/config'
import { getDictionary } from '@/lib/i18n/dictionaries'
import { getPost, posts } from '@/lib/posts'

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
  return {
    title: post.title[lang],
    description: post.description[lang],
    alternates: alternates(lang, `posts/${slug}`),
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

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-6 py-16">
      <div className="flex items-center justify-between gap-4">
        <Link
          href={`/${lang}/posts`}
          className="text-muted-foreground hover:text-foreground font-mono text-sm transition-colors"
        >
          {dict.post.back}
        </Link>
        <ReadingPanel labels={dict.reading} />
      </div>

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
