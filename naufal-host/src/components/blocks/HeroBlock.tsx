import { Fragment, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Cell } from '@/components/Cell'

const NAME = 'Naufal Yusran'
const GLOW = '52, 211, 153' // emerald
const LETTER_STYLE = {
  transition: 'transform 150ms ease-out, text-shadow 150ms ease-out',
}

// Pre-computed word-letter map with a flat global index, so the JSX doesn't
// have to mutate a counter during render.
const WORDS = (() => {
  let g = 0
  return NAME.split(' ').map((word) =>
    word.split('').map((ch) => ({ ch, i: g++ }))
  )
})()

function prefersReducedMotion() {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
}

export function HeroBlock() {
  const { t } = useTranslation()
  const wordmarkRef = useRef<HTMLHeadingElement>(null)
  const frame = useRef(0)
  const [reduce, setReduce] = useState(prefersReducedMotion)

  // React to OS-level reduced-motion preference changes — rare but free.
  useEffect(() => {
    const mql = window.matchMedia('(prefers-reduced-motion: reduce)')
    const onChange = () => setReduce(mql.matches)
    mql.addEventListener('change', onChange)
    return () => mql.removeEventListener('change', onChange)
  }, [])

  useEffect(() => {
    if (reduce) return
    const wordmark = wordmarkRef.current
    if (!wordmark) return

    const letters = Array.from(
      wordmark.querySelectorAll<HTMLElement>('[data-letter]')
    )
    const radius = 130
    const maxPush = 18
    let resetTimer = 0

    function apply(clientX: number, clientY: number) {
      cancelAnimationFrame(frame.current)
      frame.current = requestAnimationFrame(() => {
        for (const el of letters) {
          const r = el.getBoundingClientRect()
          const dx = r.left + r.width / 2 - clientX
          const dy = r.top + r.height / 2 - clientY
          const dist = Math.hypot(dx, dy) || 1
          if (dist < radius) {
            const s = 1 - dist / radius
            el.style.transform = `translate(${(dx / dist) * s * maxPush}px, ${(dy / dist) * s * maxPush}px)`
            el.style.textShadow = `0 0 ${s * 22}px rgba(${GLOW}, ${s * 0.8})`
          } else {
            el.style.transform = ''
            el.style.textShadow = ''
          }
        }
      })
    }

    function reset() {
      cancelAnimationFrame(frame.current)
      for (const el of letters) {
        el.style.transform = ''
        el.style.textShadow = ''
      }
    }

    const onMouseMove = (e: MouseEvent) => apply(e.clientX, e.clientY)
    const onTouchStart = (e: TouchEvent) => {
      if (resetTimer) {
        clearTimeout(resetTimer)
        resetTimer = 0
      }
      const t = e.touches[0]
      if (t) apply(t.clientX, t.clientY)
    }
    const onTouchMove = (e: TouchEvent) => {
      const t = e.touches[0]
      if (t) apply(t.clientX, t.clientY)
    }
    const onTouchEnd = () => {
      resetTimer = window.setTimeout(() => {
        reset()
        resetTimer = 0
      }, 350)
    }

    wordmark.addEventListener('mousemove', onMouseMove)
    wordmark.addEventListener('mouseleave', reset)
    wordmark.addEventListener('touchstart', onTouchStart, { passive: true })
    wordmark.addEventListener('touchmove', onTouchMove, { passive: true })
    wordmark.addEventListener('touchend', onTouchEnd)
    wordmark.addEventListener('touchcancel', onTouchEnd)
    return () => {
      cancelAnimationFrame(frame.current)
      if (resetTimer) clearTimeout(resetTimer)
      reset() // unwind any in-progress repel before detaching
      wordmark.removeEventListener('mousemove', onMouseMove)
      wordmark.removeEventListener('mouseleave', reset)
      wordmark.removeEventListener('touchstart', onTouchStart)
      wordmark.removeEventListener('touchmove', onTouchMove)
      wordmark.removeEventListener('touchend', onTouchEnd)
      wordmark.removeEventListener('touchcancel', onTouchEnd)
    }
  }, [reduce])

  return (
    <Cell label="// hero · host-native React">
      <div className="py-6">
        <h1
          ref={wordmarkRef}
          className="text-5xl font-semibold tracking-tight sm:text-6xl"
        >
          {WORDS.map((chars, wi) => (
            <Fragment key={wi}>
              {wi > 0 && ' '}
              <span className="inline-block whitespace-nowrap select-none">
                {chars.map(({ ch, i }) => (
                  <span
                    key={i}
                    data-letter
                    className="inline-block"
                    style={LETTER_STYLE}
                  >
                    {ch}
                  </span>
                ))}
              </span>
            </Fragment>
          ))}
        </h1>
        <p className="text-muted-foreground mt-4 text-base">
          {t('hero.tagline')}
        </p>
      </div>
    </Cell>
  )
}
