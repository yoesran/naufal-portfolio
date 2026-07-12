'use client'

import { Button } from '@/components/ui/button'
import { LOOKS, type Look } from '@/lib/content'

// One look, two pickers (simulator + photo editor): both render this against
// the same lifted state, so choosing "Blue Hour" anywhere selects it
// everywhere and the WhatsApp brief follows.
export function LookChips({
  look,
  setLook,
}: {
  look: Look
  setLook: (l: Look) => void
}) {
  return (
    <>
      {(Object.keys(LOOKS) as Look[]).map((l) => (
        <Button
          key={l}
          variant="chip"
          size="auto"
          aria-pressed={look === l}
          onClick={() => setLook(l)}
        >
          {l}
        </Button>
      ))}
    </>
  )
}
