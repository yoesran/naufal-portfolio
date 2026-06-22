import { describe, expect, it } from 'vitest'

import { locales } from './i18n/config'
import { buildKnowledge } from './knowledge'

describe('buildKnowledge', () => {
  const k = buildKnowledge()

  it('has the versioned contract shape', () => {
    expect(k.version).toBe(1)
    expect(typeof k.generatedAt).toBe('string')
    for (const l of locales) expect(k.cv[l]).toBeDefined()
    expect(Array.isArray(k.posts)).toBe(true)
  })

  it('never exposes the phone number (print-only on the CV)', () => {
    const serialized = JSON.stringify(k)
    expect(serialized).not.toContain('phone')
    expect(serialized).not.toMatch(/\+?62\d{6,}/) // no Indonesian phone digits
    for (const l of locales) {
      expect(k.cv[l].contact).not.toHaveProperty('phone')
      expect(k.cv[l].contact.email).toContain('@')
    }
  })

  it('carries every post with a per-locale title + description + body', () => {
    for (const post of k.posts) {
      for (const l of locales) {
        expect(post.title[l].length).toBeGreaterThan(0)
        expect(post.description[l].length).toBeGreaterThan(0)
        // Body text is extracted for passage retrieval (no code fences left).
        expect(post.body[l].length).toBeGreaterThan(100)
        expect(post.body[l]).not.toContain('```')
      }
    }
  })
})
