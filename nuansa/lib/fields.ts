/**
 * FIELD VOCABULARY — the platform's one piece of generic machinery.
 * ─────────────────────────────────────────────────────────────────────────────
 * A section declares a *contract*: a record of fields built from `f.*`. Each
 * field carries BOTH a Zod schema (validation + inferred type) and the UI
 * metadata the form generator renders from. One declaration is then enforced at
 * every boundary — TypeScript types (`ContentOf`), the editor form
 * (zodResolver), the server on save, and render-time parse.
 *
 * Adding a new field type is the only reason to touch this file (SPEC.md:
 * "capabilities are the unit of platform work"). Sections never do.
 * ─────────────────────────────────────────────────────────────────────────────
 */
import * as z from 'zod'

export type FieldKind =
  | 'text'
  | 'textarea'
  | 'image'
  | 'date'
  | 'select'
  | 'toggle'
  | 'group'
  | 'list'

export interface SelectOption {
  value: string
  label: string
}

export interface FieldMeta<S extends z.ZodType = z.ZodType> {
  kind: FieldKind
  label: string
  schema: S
  placeholder?: string
  required?: boolean
  options?: readonly SelectOption[] // select
  fields?: Contract // group
  item?: FieldMeta // list
  min?: number // list
  max?: number // list
}

export type Contract = Record<string, FieldMeta>

/**
 * A z.object from a record of fields — used for a whole contract (the editor's
 * zodResolver, the server on save, render-time parse) and for a group's nested
 * fields. `ContentOf` derives the matching TypeScript type from the same source.
 */
export function buildSchema<C extends Contract>(fields: C) {
  const shape = {} as { [K in keyof C]: C[K]['schema'] }
  for (const key in fields) shape[key] = fields[key].schema
  return z.object(shape)
}

// Apply list min/max while preserving the element type. The explicit
// `ZodArray<T>` in and out is what stops `.min()/.max()` reassignment from
// widening the element to `unknown` (which breaks ContentOf for lists).
function withArrayLimits<T extends z.ZodType>(
  arr: z.ZodArray<T>,
  opts: { min?: number; max?: number }
): z.ZodArray<T> {
  let out = arr
  if (opts.min != null) out = out.min(opts.min, `Minimal ${opts.min}`)
  if (opts.max != null) out = out.max(opts.max, `Maksimal ${opts.max}`)
  return out
}

interface TextOpts {
  required?: boolean
  maxLength?: number
  placeholder?: string
}

// Note: the inferred type is `string | undefined` for required fields too — the
// `required` flag changes the *runtime* schema (min(1)), not the type. That's
// deliberate: renderers must tolerate empty content anyway (SPEC shell rule #2),
// and the editor's validation still blocks saving an empty required field.
function stringSchema(label: string, { required, maxLength }: TextOpts) {
  let s = z.string()
  if (maxLength != null) s = s.max(maxLength, `Maksimal ${maxLength} karakter`)
  return required ? s.min(1, `${label} wajib diisi`) : s.optional()
}

export const f = {
  text(label: string, opts: TextOpts = {}) {
    return {
      kind: 'text',
      label,
      placeholder: opts.placeholder,
      required: opts.required,
      schema: stringSchema(label, opts),
    } satisfies FieldMeta
  },

  textarea(label: string, opts: TextOpts = {}) {
    return {
      kind: 'textarea',
      label,
      placeholder: opts.placeholder,
      required: opts.required,
      schema: stringSchema(label, opts),
    } satisfies FieldMeta
  },

  // ponytail: image is a plain string (URL) in v1 — no URL validation until it
  // earns it; a broken URL just renders a broken <img> the renderer tolerates.
  // Upgrade path: a real upload control + validation when Supabase Storage lands.
  image(label: string, opts: TextOpts = {}) {
    return {
      kind: 'image',
      label,
      placeholder: opts.placeholder,
      required: opts.required,
      schema: stringSchema(label, opts),
    } satisfies FieldMeta
  },

  date(label: string, opts: TextOpts = {}) {
    return {
      kind: 'date',
      label,
      required: opts.required,
      schema: stringSchema(label, opts),
    } satisfies FieldMeta
  },

  select(
    label: string,
    options: readonly SelectOption[],
    opts: { required?: boolean } = {}
  ) {
    const values = options.map((o) => o.value) as [string, ...string[]]
    const base = z.enum(values)
    return {
      kind: 'select',
      label,
      options,
      required: opts.required,
      schema: opts.required ? base : base.optional(),
    } satisfies FieldMeta
  },

  toggle(label: string) {
    return { kind: 'toggle', label, schema: z.boolean() } satisfies FieldMeta
  },

  group<C extends Contract>(label: string, fields: C) {
    return {
      kind: 'group',
      label,
      fields,
      schema: buildSchema(fields),
    } satisfies FieldMeta
  },

  // Generic over the item's *schema* (not the whole FieldMeta): a deferred
  // `I["schema"]` indexed access won't infer through z.array, and the element
  // type silently collapses to `unknown`.
  list<S extends z.ZodType>(
    label: string,
    item: FieldMeta<S>,
    opts: { min?: number; max?: number } = {}
  ) {
    return {
      kind: 'list',
      label,
      item,
      min: opts.min,
      max: opts.max,
      schema: withArrayLimits(z.array(item.schema), opts),
    } satisfies FieldMeta
  },
}

// Map each field to the inferred type of its schema. More robust than
// z.infer<ReturnType<buildSchema>> — it reads element/nested types straight
// from each field's own schema without a z.object round-trip.
export type ContentOf<C extends Contract> = {
  [K in keyof C]: z.infer<C[K]['schema']>
}

// A blank value for a field — seeds new list items and default form state.
export function emptyValue(field: FieldMeta): unknown {
  switch (field.kind) {
    case 'toggle':
      return false
    case 'list':
      return []
    case 'group': {
      const out: Record<string, unknown> = {}
      for (const key in field.fields) out[key] = emptyValue(field.fields[key])
      return out
    }
    default:
      return ''
  }
}
