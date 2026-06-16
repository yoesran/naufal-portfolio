// jsdom implements neither ResizeObserver (Svelte's `bind:clientWidth` uses it)
// nor matchMedia (the components read prefers-reduced-motion on init). Stub both
// so the components mount cleanly under jsdom; the observer is a no-op, so width
// stays 0 and the physics rAF loop never starts (nothing to animate in a test).
if (!('ResizeObserver' in globalThis)) {
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver
}

if (!window.matchMedia) {
  window.matchMedia = (query: string) =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    }) as unknown as MediaQueryList
}
