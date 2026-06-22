import { useEffect, useState } from 'react'

import { useMediaQuery } from '@/lib/useMediaQuery'

// Types `text` out one character at a time. Shared by the experience prompt
// (TypedLine) and the assistant (ChatBlock). Progress is keyed to the text it
// was typed for, so a text change *derives* back to zero instead of a synchronous
// setState in an effect (the React Compiler forbids that — see gotchas #32).
// Instant under reduced motion. `active: false` holds it unstarted (the prompt
// waits until it scrolls into view).
export function useTypewriter(
  text: string,
  opts?: { active?: boolean; speedMs?: number }
): { shown: string; done: boolean } {
  const active = opts?.active ?? true
  const speedMs = opts?.speedMs ?? 12
  const reduce = useMediaQuery('(prefers-reduced-motion: reduce)')
  const [typed, setTyped] = useState({ for: text, n: 0 })
  const count = reduce ? text.length : typed.for === text ? typed.n : 0

  useEffect(() => {
    if (!active || reduce) return
    const id = setInterval(() => {
      setTyped((prev) => {
        const current = prev.for === text ? prev.n : 0
        if (current >= text.length) {
          clearInterval(id)
          return prev
        }
        return { for: text, n: current + 1 }
      })
    }, speedMs)
    return () => clearInterval(id)
  }, [text, active, reduce, speedMs])

  return { shown: text.slice(0, count), done: count >= text.length }
}
