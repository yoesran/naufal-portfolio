import { describe, expect, it } from 'vitest'

import { locales } from '@/lib/i18n/config'
import { getPost, isPostDetailPath, posts } from '@/lib/posts'

describe('getPost', () => {
  it('finds a registered post by slug', () => {
    expect(getPost('writing-with-mdx')?.slug).toBe('writing-with-mdx')
  })

  it('returns undefined for an unknown slug', () => {
    expect(getPost('does-not-exist')).toBeUndefined()
  })
})

describe('posts registry', () => {
  it('has a non-empty title and description in every locale', () => {
    for (const post of posts) {
      for (const l of locales) {
        expect(post.title[l]?.length).toBeGreaterThan(0)
        expect(post.description[l]?.length).toBeGreaterThan(0)
      }
    }
  })

  it('uses unique slugs', () => {
    const slugs = posts.map((p) => p.slug)
    expect(new Set(slugs).size).toBe(slugs.length)
  })

  it('dates are ISO yyyy-mm-dd', () => {
    for (const post of posts) {
      expect(post.date).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    }
  })
})

describe('isPostDetailPath', () => {
  it('is true for a post-detail route in any locale', () => {
    expect(isPostDetailPath('/en/posts/writing-with-mdx')).toBe(true)
    expect(isPostDetailPath('/id/posts/some-slug')).toBe(true)
  })

  it('is false for the posts index and other routes', () => {
    expect(isPostDetailPath('/en/posts')).toBe(false)
    expect(isPostDetailPath('/en')).toBe(false)
    expect(isPostDetailPath('/en/cv')).toBe(false)
    expect(isPostDetailPath('/')).toBe(false)
  })
})
