import { type ComponentProps, forwardRef } from 'react'

import NextLink from 'next/link'

// Next 16 ships incremental "segment" prefetching by default: <Link> fetches
// per-segment RSC payloads ahead of navigation (e.g. the request
// `/en/__next.$d$lang.__PAGE__.txt`). Under `output: export` those segment files
// are emitted at a different path shape (`/en/__next.$d$lang/__PAGE__.txt`, with
// a slash), so every prefetch 404s on a static host — and prefetch can't work
// here regardless. There's no config flag to turn segment prefetch off, so this
// wrapper defaults `prefetch={false}`; click navigation still fetches the real
// page. Pass `prefetch` explicitly to override on a specific link.
//
// forwardRef so the ref survives — the MobileMenu drawer hands this to Base UI's
// `render` prop, which clones it with a ref for focus management.
type Props = ComponentProps<typeof NextLink>

export const Link = forwardRef<HTMLAnchorElement, Props>(function Link(
  { prefetch = false, ...props },
  ref
) {
  return <NextLink ref={ref} prefetch={prefetch} {...props} />
})
