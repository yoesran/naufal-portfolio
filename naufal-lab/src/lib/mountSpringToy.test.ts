import { describe, expect, it } from 'vitest'

import mountSpringToy from './mountSpringToy'

// Exercises the framework-agnostic mount contract the host relies on:
// `(target, opts?) => cleanup`. The host never imports Svelte — it only calls
// this and trusts the returned teardown, so that's exactly what we assert.
function mountInto(opts?: Record<string, unknown>) {
  const target = document.createElement('div')
  document.body.appendChild(target)
  const cleanup = mountSpringToy(target, opts)
  return { target, cleanup }
}

describe('mountSpringToy', () => {
  it('renders into the target and returns a cleanup that empties it', () => {
    const { target, cleanup } = mountInto()
    expect(typeof cleanup).toBe('function')
    expect(target.childElementCount).toBeGreaterThan(0)
    expect(
      target.querySelector('[aria-label="Grab the Svelte ticket"]')
    ).not.toBeNull()

    cleanup()
    expect(target.childElementCount).toBe(0)
    target.remove()
  })

  it('defaults to the host (embedded) context', () => {
    const { target, cleanup } = mountInto()
    expect(target.textContent).toContain('embedded in React host')
    cleanup()
    target.remove()
  })

  it('honours an explicit standalone context', () => {
    const { target, cleanup } = mountInto({ context: 'standalone' })
    expect(target.textContent).toContain('standalone Svelte app')
    cleanup()
    target.remove()
  })

  it('treats an unknown context value as host', () => {
    const { target, cleanup } = mountInto({ context: 'bogus' })
    expect(target.textContent).toContain('embedded in React host')
    cleanup()
    target.remove()
  })
})
