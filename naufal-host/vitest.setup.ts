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

class ObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return []
  }
}
globalThis.IntersectionObserver ??=
  ObserverStub as unknown as typeof IntersectionObserver
globalThis.ResizeObserver ??= ObserverStub as unknown as typeof ResizeObserver
globalThis.requestAnimationFrame ??= ((cb: FrameRequestCallback) =>
  setTimeout(
    () => cb(performance.now()),
    0
  ) as unknown as number) as typeof requestAnimationFrame
globalThis.cancelAnimationFrame ??= ((id: number) =>
  clearTimeout(id)) as typeof cancelAnimationFrame
