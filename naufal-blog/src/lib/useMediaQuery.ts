import { useEffect, useState } from 'react'

// Subscribe to a CSS media query. Mirrors naufal-host's hook, but starts `false`
// on the server / first client render (no `window` during static export) and
// resolves after mount — reading matchMedia in the initializer like the host
// does would mismatch the prerendered HTML and trip a hydration error.
//
// Used to unmount the mobile nav menu on desktop: its popup portals to <body>,
// so a `sm:hidden` class on the trigger can't reliably hide it (gotchas #20).
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false)

  useEffect(() => {
    const mql = window.matchMedia(query)
    const onChange = () => setMatches(mql.matches)
    onChange()
    mql.addEventListener('change', onChange)
    return () => mql.removeEventListener('change', onChange)
  }, [query])

  return matches
}
