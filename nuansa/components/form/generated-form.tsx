'use client'

import { Controller, useFieldArray, useFormContext } from 'react-hook-form'

import { Plus, Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { FieldError } from '@/components/ui/field-error'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { type Contract, type FieldMeta, emptyValue } from '@/lib/fields'

/**
 * Renders an editing form from a contract. Assumes it's inside a FormProvider.
 * Every control derives from a field's `kind` — this component is the whole
 * "form generator"; shells and the editor never build forms by hand.
 *
 * `prefix` roots the generated field names somewhere other than the form's top
 * level (e.g. `sections.2.content`), which is how one form edits a whole list
 * of differently-shaped sections.
 */
export function GeneratedForm({
  contract,
  prefix,
}: {
  contract: Contract
  prefix?: string
}) {
  return (
    <div className="space-y-6">
      {Object.entries(contract).map(([name, field]) => (
        <FieldControl
          key={name}
          name={prefix ? `${prefix}.${name}` : name}
          field={field}
        />
      ))}
    </div>
  )
}

// `name` is the RHF dot-path (e.g. `cover.person1`, `story.0.title`).
function FieldControl({ name, field }: { name: string; field: FieldMeta }) {
  switch (field.kind) {
    case 'group':
      return <GroupControl name={name} field={field} />
    case 'list':
      return <ListControl name={name} field={field} />
    case 'toggle':
      return <ToggleControl name={name} field={field} />
    case 'select':
      return <SelectControl name={name} field={field} />
    default:
      return <ScalarControl name={name} field={field} />
  }
}

function RequiredMark({ field }: { field: FieldMeta }) {
  if (!field.required) return null
  return (
    <span className="text-destructive" aria-hidden>
      {' '}
      *
    </span>
  )
}

// text · textarea · image · date
function ScalarControl({ name, field }: { name: string; field: FieldMeta }) {
  const { control } = useFormContext()
  const type =
    field.kind === 'date' ? 'date' : field.kind === 'image' ? 'url' : 'text'

  return (
    <Controller
      control={control}
      name={name}
      render={({ field: rhf, fieldState }) => (
        <div className="space-y-1.5">
          <Label htmlFor={name}>
            {field.label}
            <RequiredMark field={field} />
          </Label>
          {field.kind === 'textarea' ? (
            <Textarea
              id={name}
              {...rhf}
              value={rhf.value ?? ''}
              placeholder={field.placeholder}
              aria-invalid={fieldState.invalid}
            />
          ) : (
            <Input
              id={name}
              type={type}
              {...rhf}
              value={rhf.value ?? ''}
              placeholder={field.placeholder}
              aria-invalid={fieldState.invalid}
            />
          )}
          <FieldError error={fieldState.error} />
        </div>
      )}
    />
  )
}

function ToggleControl({ name, field }: { name: string; field: FieldMeta }) {
  const { control } = useFormContext()
  return (
    <Controller
      control={control}
      name={name}
      render={({ field: rhf }) => (
        <div className="flex items-center justify-between gap-3">
          <Label htmlFor={name}>{field.label}</Label>
          <Switch
            id={name}
            checked={!!rhf.value}
            onCheckedChange={rhf.onChange}
          />
        </div>
      )}
    />
  )
}

function SelectControl({ name, field }: { name: string; field: FieldMeta }) {
  const { control } = useFormContext()
  return (
    <Controller
      control={control}
      name={name}
      render={({ field: rhf, fieldState }) => (
        <div className="space-y-1.5">
          <Label>
            {field.label}
            <RequiredMark field={field} />
          </Label>
          <Select value={rhf.value ?? ''} onValueChange={rhf.onChange}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Pilih…" />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FieldError error={fieldState.error} />
        </div>
      )}
    />
  )
}

function GroupControl({ name, field }: { name: string; field: FieldMeta }) {
  return (
    <fieldset className="space-y-4 rounded-lg border p-4">
      <legend className="px-1 text-sm font-medium">{field.label}</legend>
      {field.fields &&
        Object.entries(field.fields).map(([childName, childField]) => (
          <FieldControl
            key={childName}
            name={`${name}.${childName}`}
            field={childField}
          />
        ))}
    </fieldset>
  )
}

function ListControl({ name, field }: { name: string; field: FieldMeta }) {
  const { control } = useFormContext()
  const { fields, append, remove } = useFieldArray({ control, name })
  const item = field.item

  if (!item) return null

  const atMax = field.max != null && fields.length >= field.max
  const atMin = field.min != null && fields.length <= field.min

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium">{field.label}</p>

      {fields.map((entry, index) => (
        <div
          key={entry.id}
          className="relative space-y-3 rounded-lg border p-4 pr-12"
        >
          <FieldControl name={`${name}.${index}`} field={item} />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => remove(index)}
            disabled={atMin}
            className="absolute top-2 right-2 h-8 w-8 p-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
            aria-label={`Hapus ${field.label}`}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}

      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={atMax}
        // `as never`: RHF types append() against a statically-known field array,
        // but a generated form only knows the item shape at runtime.
        onClick={() => append(emptyValue(item) as never)}
        className="w-full"
      >
        <Plus className="mr-2 h-4 w-4" />
        Tambah {field.label}
      </Button>
    </div>
  )
}
