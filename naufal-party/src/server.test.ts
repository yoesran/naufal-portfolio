import { describe, expect, it } from 'vitest'

import {
  COLORS,
  GHOST_STEP,
  NAMES,
  colorFor,
  downsample,
  seedGhosts,
} from './server'

describe('colorFor', () => {
  it('is deterministic for the same id', () => {
    expect(colorFor('abc')).toBe(colorFor('abc'))
  })

  it('always returns a palette colour', () => {
    for (const id of ['', 'a', 'connection-42', '🦊', 'AbCdEf']) {
      expect(COLORS).toContain(colorFor(id))
    }
  })

  it('handles the empty id without throwing', () => {
    expect(() => colorFor('')).not.toThrow()
    expect(COLORS).toContain(colorFor(''))
  })

  it('spreads across more than one colour', () => {
    const seen = new Set(
      Array.from({ length: 50 }, (_, i) => colorFor(`peer-${i}`))
    )
    expect(seen.size).toBeGreaterThan(1)
  })
})

describe('downsample', () => {
  it('keeps every step-th point', () => {
    expect(downsample([0, 1, 2, 3, 4, 5, 6], 3)).toEqual([0, 3, 6])
  })

  it('turns a full recording window into ~30 ghost points', () => {
    const rec = Array.from({ length: 90 }, (_, i) => ({ x: i, y: i }))
    expect(downsample(rec, GHOST_STEP)).toHaveLength(30)
  })

  it('returns a copy, never mutating the input', () => {
    const input = [1, 2, 3, 4]
    const out = downsample(input, 2)
    expect(out).not.toBe(input)
    expect(input).toEqual([1, 2, 3, 4])
  })

  it('keeps the lone point with a step larger than the length', () => {
    expect(downsample([1, 2, 3], 10)).toEqual([1])
  })
})

describe('seedGhosts', () => {
  const ghosts = seedGhosts()

  it('seeds three drifts so the very first visitor sees something', () => {
    expect(ghosts).toHaveLength(3)
  })

  it('gives every ghost a 30-point path within the 0–1 viewport', () => {
    for (const g of ghosts) {
      expect(g.path).toHaveLength(30)
      for (const p of g.path) {
        expect(p.x).toBeGreaterThanOrEqual(0)
        expect(p.x).toBeLessThanOrEqual(1)
        expect(p.y).toBeGreaterThanOrEqual(0)
        expect(p.y).toBeLessThanOrEqual(1)
      }
    }
  })

  it('draws colours and names from the real pools', () => {
    for (const g of ghosts) {
      expect(COLORS).toContain(g.color)
      expect(NAMES).toContain(g.name)
    }
  })

  it('returns a fresh array each call (no shared mutable seed)', () => {
    expect(seedGhosts()).not.toBe(ghosts)
  })
})
