'use client'

import { Type } from 'lucide-react'

import { ReadingControls } from '@/components/ReadingControls'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import type { Dictionary } from '@/lib/i18n/dictionaries'

// Desktop reading customizer: a popover holding the shared ReadingControls. On
// phones the same controls live in the MobileMenu drawer instead (both read the
// reading store, so they stay in sync). Rendered in the header on post pages by
// HeaderReading.
export function ReadingPanel({ labels }: { labels: Dictionary['reading'] }) {
  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button variant="outline" size="sm" className="font-mono">
            <Type />
            {labels.label}
          </Button>
        }
      />
      <PopoverContent align="end" className="w-64">
        <ReadingControls labels={labels} />
      </PopoverContent>
    </Popover>
  )
}
