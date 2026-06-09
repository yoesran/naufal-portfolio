'use client'

import { Monitor, Moon, Sun } from 'lucide-react'

import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { type Mode, setMode, useThemeMode } from '@/lib/theme'

type Labels = { label: string; light: string; dark: string; system: string }

const ITEMS: { mode: Mode; Icon: typeof Sun }[] = [
  { mode: 'light', Icon: Sun },
  { mode: 'dark', Icon: Moon },
  { mode: 'system', Icon: Monitor },
]

export function ThemeToggle({ labels }: { labels: Labels }) {
  const mode = useThemeMode()
  return (
    <ToggleGroup
      value={[mode]}
      onValueChange={(next: string[]) => {
        const v = next[0]
        if (v) setMode(v as Mode)
      }}
      spacing={0}
      size="sm"
      variant="outline"
      aria-label={labels.label}
    >
      {ITEMS.map(({ mode: m, Icon }) => (
        <ToggleGroupItem
          key={m}
          value={m}
          aria-label={labels[m]}
          title={labels[m]}
          className="text-muted-foreground data-[state=on]:text-foreground"
        >
          <Icon className="size-3.5" />
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  )
}
