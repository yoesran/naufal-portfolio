import type { Locale } from '@/lib/i18n/config'

// Post registry — single source of truth for ordering + per-locale metadata.
// To publish: add `<slug>.mdx` bodies under src/content/<locale>/ and an entry
// here (newest first). Title/description are per-locale; the body is per-locale
// too (one MDX file per language).
export type PostMeta = {
  slug: string
  date: string // ISO 8601
  title: Record<Locale, string>
  description: Record<Locale, string>
}

export const posts: PostMeta[] = [
  {
    slug: 'styling-across-module-federation',
    date: '2026-06-22',
    title: {
      en: 'Styling across the Module Federation boundary',
      id: 'Menata gaya melintasi batas Module Federation',
    },
    description: {
      en: "A Svelte remote mounted in the React host came up half-styled. CSS variables cross the federation boundary for free; Tailwind's utility classes don't — here's why, and the one-line fix.",
      id: 'Sebuah remote Svelte yang dipasang di host React tampil setengah jadi. Variabel CSS melintasi batas federation gratis; kelas utilitas Tailwind tidak — ini alasannya, dan perbaikan satu barisnya.',
    },
  },
  {
    slug: 'writing-with-mdx',
    date: '2026-06-05',
    title: {
      en: 'Writing posts with MDX',
      id: 'Menulis dengan MDX',
    },
    description: {
      en: "How this blog's posts are authored — MDX bodies in src/content, metadata in one registry, statically exported. Doubles as the template for the next post.",
      id: 'Bagaimana tulisan di blog ini dibuat — isi MDX di src/content, metadata dalam satu registry, diekspor statis. Sekaligus jadi templat untuk tulisan berikutnya.',
    },
  },
]

export function getPost(slug: string): PostMeta | undefined {
  return posts.find((post) => post.slug === slug)
}

// True for a post-detail route (/{lang}/posts/{slug}), not the posts index.
// Single source for the header bits that only apply on a post page (the reading
// panel) — used by HeaderReading and the MobileMenu drawer.
export function isPostDetailPath(pathname: string): boolean {
  const seg = pathname.split('/').filter(Boolean) // [lang, 'posts', slug]
  return seg[1] === 'posts' && seg.length >= 3
}
