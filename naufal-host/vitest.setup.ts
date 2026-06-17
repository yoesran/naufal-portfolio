import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, vi } from 'vitest'

// Unmount React + clear the DOM between component tests.
afterEach(() => {
  cleanup()
})

// jsdom doesn't implement these browser APIs that host components touch at mount
// (the theme listener, scroll-reveal via IntersectionObserver, the orbit's rAF
// loop, measured panels via ResizeObserver). Stub them so components can render;
// the pure unit cases never hit them, and no test asserts on their behaviour
// (visual things like the orbit / canvas transforms live in the Playwright suite).
if (!window.matchMedia) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }),
  })
}

// ResizeObserver: a no-op (measured-height reads offsetHeight = 0 in jsdom).
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
globalThis.ResizeObserver ??=
  ResizeObserverStub as unknown as typeof ResizeObserver

// IntersectionObserver: fire "intersecting" once on observe, so reveal-gated UI
// (the scroll-reveal Cells) renders its in-view state in tests instead of
// staying stuck hidden.
class IntersectionObserverStub {
  private cb: IntersectionObserverCallback
  constructor(cb: IntersectionObserverCallback) {
    this.cb = cb
  }
  observe(el: Element) {
    this.cb(
      [{ isIntersecting: true, target: el } as IntersectionObserverEntry],
      this as unknown as IntersectionObserver
    )
  }
  unobserve() {}
  disconnect() {}
  takeRecords(): IntersectionObserverEntry[] {
    return []
  }
}
// Force (not ??=) so our firing stub wins even if the environment ships a
// no-op IntersectionObserver — reveal-gated UI must actually reveal in tests.
globalThis.IntersectionObserver =
  IntersectionObserverStub as unknown as typeof IntersectionObserver
globalThis.requestAnimationFrame ??= ((cb: FrameRequestCallback) =>
  setTimeout(
    () => cb(performance.now()),
    0
  ) as unknown as number) as typeof requestAnimationFrame
globalThis.cancelAnimationFrame ??= ((id: number) =>
  clearTimeout(id)) as typeof cancelAnimationFrame
