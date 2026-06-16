import { describe, expect, it } from 'vitest'

import { alternates } from '@/lib/i18n/alternates'
import { defaultLocale, locales } from '@/lib/i18n/config'
import { SITE_URL } from '@/lib/site'

describe('alternates', () => {
  it('canonical points at the given locale + subpath', () => {
    expect(alternates('en', 'posts/x').canonical).toBe(`${SITE_URL}/en/posts/x`)
    expect(alternates('id', 'cv').canonical).toBe(`${SITE_URL}/id/cv`)
  })

  it('lists every locale plus x-default in languages', () => {
    const { languages } = alternates('en', 'cv')
    for (const l of locales) {
      expect(languages[l]).toBe(`${SITE_URL}/${l}/cv`)
    }
    expect(languages['x-default']).toBe(`${SITE_URL}/${defaultLocale}/cv`)
  })

  it('omits the trailing slash when subpath is empty', () => {
    expect(alternates('en').canonical).toBe(`${SITE_URL}/en`)
    expect(alternates('en').languages.en).toBe(`${SITE_URL}/en`)
    expect(alternates('en').languages['x-default']).toBe(
      `${SITE_URL}/${defaultLocale}`
    )
  })
})
