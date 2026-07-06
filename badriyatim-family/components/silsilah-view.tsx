'use client'

import { useState } from 'react'

import { PohonCanvas, type TreeMode } from '@/components/pohon-canvas'
import { PohonTree } from '@/components/pohon-tree'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import type { Silsila } from '@/lib/family'

type View = TreeMode | 'daftar'

const VIEWS: { key: View; label: string }[] = [
  { key: 'radial', label: 'Radial' },
  { key: 'linear', label: 'Pohon' },
  { key: 'daftar', label: 'Daftar' },
]

// Radial tree by default (the showpiece); a linear tree and the accessible list a
// tap away. Single-select ToggleGroup à la the host: value=[current], take
// next[0] and ignore the deselect-to-empty case.
export function SilsilahView({ silsila }: { silsila: Silsila }) {
  const [view, setView] = useState<View>('radial')
  return (
    <div>
      <ToggleGroup
        aria-label="Tampilan silsilah"
        value={[view]}
        onValueChange={(next) => next[0] && setView(next[0] as View)}
        spacing={0}
        className="border-border bg-card mb-4 rounded-lg border p-0.5"
      >
        {VIEWS.map((v) => (
          <ToggleGroupItem
            key={v.key}
            value={v.key}
            className="text-tanah-soft hover:text-marun aria-pressed:bg-marun aria-pressed:text-gading data-[state=on]:bg-marun data-[state=on]:text-gading min-h-11 rounded-md px-4 hover:bg-transparent"
          >
            {v.label}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
      {view === 'daftar' ? (
        <PohonTree silsila={silsila} />
      ) : (
        <PohonCanvas silsila={silsila} mode={view} />
      )}
    </div>
  )
}
