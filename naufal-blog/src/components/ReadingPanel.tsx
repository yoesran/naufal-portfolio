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

// Reading customizer: a popover holding the shared ReadingControls. Rendered in
// the header on post pages (by HeaderReading) at every viewport — icon-only on
// phones, icon + label from sm up. The trigger keeps an aria-label so it stays
// named when the text is hidden.
export function ReadingPanel({ labels }: { labels: Dictionary['reading'] }) {
  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button
            variant="outline"
            size="sm"
            aria-label={labels.label}
            className="font-mono"
          >
            <Type />
            <span className="hidden sm:inline">{labels.label}</span>
          </Button>
        }
      />
      <PopoverContent align="end" className="w-64">
        <ReadingControls labels={labels} />
      </PopoverContent>
    </Popover>
  )
}
