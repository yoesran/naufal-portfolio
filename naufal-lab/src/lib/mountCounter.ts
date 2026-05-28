import { mount, unmount } from 'svelte'

import Counter from './Counter.svelte'

export default function mountCounter(
  target: HTMLElement,
  opts: Record<string, unknown> = {}
) {
  const context = opts.context === 'standalone' ? 'standalone' : 'host'
  const instance = mount(Counter, {
    target,
    props: { context },
  })
  return () => unmount(instance)
}
