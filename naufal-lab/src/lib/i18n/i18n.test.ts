import { waitLocale } from 'svelte-i18n'
import { get } from 'svelte/store'
import { beforeAll, describe, expect, it } from 'vitest'

import { t } from './index'

beforeAll(async () => {
  await waitLocale()
})

describe('lab i18n', () => {
  it('formats a known key in English', () => {
    expect(get(t)('springToy.label')).toBe('live svelte component')
  })

  it('interpolates values', () => {
    expect(get(t)('presence.self', { values: { name: 'Otter' } })).toBe(
      "you're Otter"
    )
  })

  it('resolves ICU plurals by count', () => {
    expect(get(t)('presence.cursors', { values: { count: 0 } })).toContain(
      'open a second tab'
    )
    expect(get(t)('presence.cursors', { values: { count: 1 } })).toContain(
      '1 other cursor live'
    )
  })
})
