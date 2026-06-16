import { describe, expect, it } from 'vitest'

import { locales } from '@/lib/i18n/config'
import { posts } from '@/lib/posts'
import { SITE_URL } from '@/lib/site'

import sitemap from './sitemap'

describe('sitemap', () => {
  const entries = sitemap()

  it('emits one entry per locale for each static route and post', () => {
    const staticRoutes = 3 // '', 'posts', 'cv'
    expect(entries).toHaveLength(locales.length * (staticRoutes + posts.length))
  })

  it('every URL is absolute under SITE_URL and locale-prefixed', () => {
    for (const e of entries) {
      expect(e.url.startsWith(`${SITE_URL}/`)).toBe(true)
      const firstSeg = e.url.slice(SITE_URL.length + 1).split('/')[0]
      expect(locales).toContain(firstSeg as (typeof locales)[number])
    }
  })

  it('carries hreflang alternates with an x-default on every entry', () => {
    for (const e of entries) {
      const langs = e.alternates?.languages ?? {}
      for (const l of locales) expect(langs[l]).toBeTruthy()
      expect(langs['x-default']).toBeTruthy()
    }
  })

  it('includes the home route for each locale', () => {
    for (const l of locales) {
      expect(entries.some((e) => e.url === `${SITE_URL}/${l}`)).toBe(true)
    }
  })
})
