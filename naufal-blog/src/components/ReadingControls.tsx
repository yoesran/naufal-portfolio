'use client'

import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import type { Dictionary } from '@/lib/i18n/dictionaries'
import {
  type Bg,
  FONT_STACKS,
  type Font,
  MAX_SIZE,
  MIN_SIZE,
  resetReading,
  setBg,
  setFont,
  setSize,
  useReading,
} from '@/lib/reading'

// The font / size / background controls, backed by the shared reading store.
// Rendered both in the desktop ReadingPanel popover and the mobile drawer; the
// store keeps them in sync. `labels` is the full reading dictionary slice.
export function ReadingControls({ labels }: { labels: Dictionary['reading'] }) {
  const { font, size, bg } = useReading()

  const fonts: [Font, string][] = [
    ['sans', labels.fontSans],
    ['serif', labels.fontSerif],
    ['mono', labels.fontMono],
  ]
  const bgs: [Bg, string][] = [
    ['default', labels.bgDefault],
    ['paper', labels.bgPaper],
    ['sepia', labels.bgSepia],
    ['ink', labels.bgInk],
  ]

  return (
    <div className="flex flex-col gap-3.5">
      <Group label={labels.font}>
        <ToggleGroup
          value={[font]}
          onValueChange={(next: string[]) => {
            const v = next[0]
            if (v) setFont(v as Font)
          }}
          spacing={0}
          size="sm"
          variant="outline"
          className="w-full"
        >
          {fonts.map(([value, text]) => (
            <ToggleGroupItem
              key={value}
              value={value}
              className="text-muted-foreground data-[state=on]:text-foreground flex-1"
              style={{ fontFamily: FONT_STACKS[value] }}
            >
              {text}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </Group>

      <Group label={`${labels.size} · ${size}px`}>
        <Slider
          min={MIN_SIZE}
          max={MAX_SIZE}
          value={[size]}
          onValueChange={(v) => setSize(Array.isArray(v) ? v[0] : v)}
          aria-label={labels.size}
        />
      </Group>

      <Group label={labels.background}>
        <ToggleGroup
          value={[bg]}
          onValueChange={(next: string[]) => {
            const v = next[0]
            if (v) setBg(v as Bg)
          }}
          spacing={0}
          size="sm"
          variant="outline"
          className="w-full"
        >
          {bgs.map(([value, text]) => (
            <ToggleGroupItem
              key={value}
              value={value}
              className="text-muted-foreground data-[state=on]:text-foreground flex-1 px-1"
            >
              {text}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </Group>

      <Button
        variant="ghost"
        size="sm"
        onClick={resetReading}
        className="text-muted-foreground self-start font-mono"
      >
        {labels.reset}
      </Button>
    </div>
  )
}

function Group({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-muted-foreground font-mono text-[0.7rem] tracking-wide uppercase">
        {label}
      </p>
      {children}
    </div>
  )
}
