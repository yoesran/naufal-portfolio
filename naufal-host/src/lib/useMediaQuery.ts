import { useEffect, useState } from 'react'

// Subscribe to a CSS media query. Used to gate components out of the DOM
// (not just visually hide them) — e.g. the header's mobile nav menu, whose
// popup portals to <body> and so can't be hidden with a `sm:hidden` class.
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() =>
    typeof window === 'undefined' ? false : window.matchMedia(query).matches
  )

  useEffect(() => {
    const mql = window.matchMedia(query)
    const onChange = () => setMatches(mql.matches)
    onChange()
    mql.addEventListener('change', onChange)
    return () => mql.removeEventListener('change', onChange)
  }, [query])

  return matches
}
