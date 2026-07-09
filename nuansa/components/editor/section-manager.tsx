'use client'

import { useState } from 'react'
import { Controller, useFieldArray, useFormContext } from 'react-hook-form'

import { ChevronDown, ChevronUp, Plus, Trash2 } from 'lucide-react'

import { GeneratedForm } from '@/components/form/generated-form'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { createInstance } from '@/lib/sections'
import type { Shell } from '@/lib/shells'
import { type SiteContent, supportedSections } from '@/lib/site'
import { SECTIONS } from '@/sections'

/**
 * The concierge's composition surface: reorder, toggle, add and remove
 * sections. Move up/down buttons rather than drag-and-drop — keyboard- and
 * screen-reader-accessible for free, and no dependency for a tool we operate
 * ourselves. Clients never see this.
 */
export function SectionManager({ shell }: { shell: Shell }) {
  // Typing the context gives `field.type` / `field.key` for free — RHF spreads
  // the value onto each field object alongside its own `id`.
  const { control } = useFormContext<SiteContent>()
  const { fields, append, remove, move } = useFieldArray({
    control,
    name: 'sections',
  })

  const [openKeys, setOpenKeys] = useState<Set<string>>(new Set())
  const setOpen = (key: string, open: boolean) =>
    setOpenKeys((previous) => {
      const next = new Set(previous)
      if (open) next.add(key)
      else next.delete(key)
      return next
    })

  // Only what this shell can render — the add list *is* the compatibility rule.
  const addable = supportedSections(shell)

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        {fields.map((field, index) => {
          const definition = SECTIONS[field.type]
          const open = openKeys.has(field.key)

          if (!definition) return null

          return (
            <div key={field.id} className="rounded-xl border bg-card">
              <div className="flex items-center gap-2 border-b bg-muted/30 px-3 py-2">
                <button
                  type="button"
                  onClick={() => setOpen(field.key, !open)}
                  aria-expanded={open}
                  className="flex min-h-11 flex-1 items-center gap-2 text-left text-sm font-medium"
                >
                  <definition.Icon className="size-4 shrink-0" aria-hidden />
                  {definition.label}
                </button>

                <Controller
                  control={control}
                  name={`sections.${index}.visible`}
                  render={({ field: visible }) => (
                    // aria-label rather than a visible <Label>: several sections
                    // sit on screen at once, so "Tampil" alone names nothing.
                    <Switch
                      aria-label={`Tampilkan ${definition.label}`}
                      checked={!!visible.value}
                      onCheckedChange={visible.onChange}
                    />
                  )}
                />

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={index === 0}
                  onClick={() => move(index, index - 1)}
                  aria-label={`Naikkan ${definition.label}`}
                  className="size-9 p-0"
                >
                  <ChevronUp className="size-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={index === fields.length - 1}
                  onClick={() => move(index, index + 1)}
                  aria-label={`Turunkan ${definition.label}`}
                  className="size-9 p-0"
                >
                  <ChevronDown className="size-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setOpen(field.key, false)
                    remove(index)
                  }}
                  aria-label={`Hapus ${definition.label}`}
                  className="size-9 p-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>

              {open && (
                <div className="p-4">
                  <GeneratedForm
                    contract={definition.contract}
                    prefix={`sections.${index}.content`}
                  />
                </div>
              )}
            </div>
          )
        })}
      </div>

      <div className="rounded-xl border-2 border-dashed p-4">
        <p className="mb-3 text-center text-sm font-medium text-muted-foreground">
          Tambah bagian
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          {addable.map((section) => (
            <Button
              key={section.id}
              type="button"
              variant="outline"
              size="sm"
              // Distinct from the section card's own header button of the same label.
              aria-label={`Tambah ${section.label}`}
              onClick={() => {
                // Open it immediately: a collapsed blank card at the bottom of
                // the list looks like nothing happened.
                const instance = createInstance(section)
                append(instance)
                setOpen(instance.key, true)
              }}
            >
              <Plus className="mr-1.5 size-3.5" aria-hidden />
              {section.label}
            </Button>
          ))}
        </div>
      </div>
    </div>
  )
}
