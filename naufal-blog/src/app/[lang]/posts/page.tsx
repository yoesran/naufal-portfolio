import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { Link } from '@/components/Link'
import { alternates } from '@/lib/i18n/alternates'
import { type Locale, isLocale } from '@/lib/i18n/config'
import { getDictionary } from '@/lib/i18n/dictionaries'
import { posts } from '@/lib/posts'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>
}): Promise<Metadata> {
  const { lang } = await params
  if (!isLocale(lang)) return {}
  const dict = getDictionary(lang)
  return {
    title: dict.meta.postsTitle,
    description: dict.meta.postsDescription,
    alternates: alternates(lang, 'posts'),
  }
}

export default async function PostsPage({
  params,
}: {
  params: Promise<{ lang: string }>
}) {
  const { lang } = await params
  if (!isLocale(lang)) notFound()
  const dict = getDictionary(lang)
  const dateFmt = new Intl.DateTimeFormat(lang, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })

  return (
    <main
      id="content"
      tabIndex={-1}
      className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-6 py-16 focus:outline-none"
    >
      <Link
        href={`/${lang}`}
        className="text-muted-foreground hover:text-foreground font-mono text-sm transition-colors"
      >
        {dict.posts.backHome}
      </Link>
      <h1 className="mt-8 text-3xl font-semibold tracking-tight sm:text-4xl">
        {dict.posts.title}
      </h1>
      <p className="text-muted-foreground mt-4 text-lg leading-relaxed">
        {dict.posts.intro}
      </p>

      {posts.length === 0 ? (
        <p className="text-muted-foreground mt-12 font-mono text-sm">
          {dict.posts.empty}
        </p>
      ) : (
        <ul className="mt-12 flex flex-col gap-8">
          {posts.map((post) => (
            <li key={post.slug}>
              <Link
                href={`/${lang}/posts/${post.slug}`}
                className="group block"
              >
                <time
                  className="text-muted-foreground font-mono text-xs"
                  dateTime={post.date}
                >
                  {dateFmt.format(new Date(post.date))}
                </time>
                <h2 className="group-hover:text-brand mt-1 text-xl font-medium tracking-tight transition-colors">
                  {post.title[lang as Locale]}
                </h2>
                <p className="text-muted-foreground mt-1 leading-relaxed">
                  {post.description[lang as Locale]}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}
