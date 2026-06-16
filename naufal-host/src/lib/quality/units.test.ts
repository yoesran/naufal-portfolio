import { describe, expect, it } from 'vitest'

import { isExperienceSelection } from '../experience'
import { isLocale } from '../i18n'
import { DEFAULT_RADIUS, loadRadius, oneOf, resolveDark } from '../theme'

// Unit tests over the host's own pure helpers. Plain, idiomatic Vitest — these,
// with the RTL component tests (src/components/blocks/*.test.tsx), are what the
// Vitest report linked from the `// quality` block shows.

describe('isLocale', () => {
  it('accepts supported tags', () => {
    expect(isLocale('en')).toBe(true)
    expect(isLocale('id')).toBe(true)
  })
  it('rejects unknown or missing tags', () => {
    expect(isLocale('xx')).toBe(false)
    expect(isLocale(undefined)).toBe(false)
  })
})

describe('isExperienceSelection', () => {
  it('knows the registry slugs and the earlier group', () => {
    expect(isExperienceSelection('dbs')).toBe(true)
    expect(isExperienceSelection('earlier')).toBe(true)
  })
  it('rejects unknown or null values', () => {
    expect(isExperienceSelection('netflix')).toBe(false)
    expect(isExperienceSelection(null)).toBe(false)
  })
})

describe('resolveDark', () => {
  it('forces dark and light regardless of the system theme', () => {
    expect(resolveDark('dark')).toBe(true)
    expect(resolveDark('light')).toBe(false)
  })
})

describe('loadRadius', () => {
  it('keeps an in-range value', () => {
    expect(loadRadius('1')).toBe(1)
  })
  it('clamps out-of-range values to the default', () => {
    expect(loadRadius('99')).toBe(DEFAULT_RADIUS)
    expect(loadRadius('-1')).toBe(DEFAULT_RADIUS)
  })
  it('falls back when unset or NaN', () => {
    expect(loadRadius(null)).toBe(DEFAULT_RADIUS)
    expect(loadRadius('abc')).toBe(DEFAULT_RADIUS)
  })
})

describe('oneOf', () => {
  it('returns a member, else the fallback', () => {
    expect(oneOf(['en', 'id'], 'id', 'en')).toBe('id')
    expect(oneOf(['en', 'id'], 'zz', 'en')).toBe('en')
    expect(oneOf(['en', 'id'], null, 'en')).toBe('en')
  })
})
