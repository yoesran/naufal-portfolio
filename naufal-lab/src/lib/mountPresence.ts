import { mount, unmount } from 'svelte'

import Presence from './Presence.svelte'

export default function mountPresence(
  target: HTMLElement,
  opts: Record<string, unknown> = {}
) {
  const host = typeof opts.host === 'string' ? opts.host : undefined
  const context = opts.context === 'standalone' ? 'standalone' : 'host'
  const global = opts.global === true
  const instance = mount(Presence, {
    target,
    props: { host, context, global },
  })
  return () => unmount(instance)
}
