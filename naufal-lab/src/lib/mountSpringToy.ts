import { mount, unmount } from 'svelte'

import SpringToy from './SpringToy.svelte'

export default function mountSpringToy(
  target: HTMLElement,
  opts: Record<string, unknown> = {}
) {
  const context = opts.context === 'standalone' ? 'standalone' : 'host'
  const instance = mount(SpringToy, {
    target,
    props: { context },
  })
  return () => unmount(instance)
}
