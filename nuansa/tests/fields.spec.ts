import { expect, test } from '@playwright/test'

import { type ContentOf, buildSchema, emptyValue, f } from '../lib/fields'

// Pure-logic check for the schema generator — the one clever piece. Runs in
// the Playwright harness (no browser, no extra runner). If contract → schema
// stops enforcing what the field declarations say, this fails.

const contract = {
  title: f.text('Title', { required: true }),
  subtitle: f.text('Subtitle'),
  theme: f.select('Theme', [
    { value: 'a', label: 'A' },
    { value: 'b', label: 'B' },
  ]),
  items: f.list(
    'Items',
    f.group('Item', { name: f.text('Name', { required: true }) }),
    {
      max: 2,
    }
  ),
  fancy: f.toggle('Fancy'),
}

const schema = buildSchema(contract)

// Type-level guard, checked by `npm run typecheck`. List element types once
// collapsed to `unknown` — silently, since `unknown[]` accepts anything, so no
// runtime test could catch it. These fail to compile if inference regresses.
type Expect<T extends true> = T
type NotUnknown<T> = unknown extends T ? false : true
type Content = ContentOf<typeof contract>

export type _ListElementInfers = Expect<NotUnknown<Content['items'][number]>>
export type _GroupFieldInfers = Expect<
  NotUnknown<Content['items'][number]['name']>
>
export type _ScalarInfers = Expect<NotUnknown<Content['title']>>

test('generated schema enforces required, optional, and list limits', () => {
  const ok = (v: unknown) => schema.safeParse(v).success

  // fully valid
  expect(
    ok({
      title: 'Hi',
      subtitle: '',
      theme: 'a',
      items: [{ name: 'x' }],
      fancy: true,
    })
  ).toBe(true)
  // optional fields omitted → still valid
  expect(ok({ title: 'Hi', items: [], fancy: false })).toBe(true)
  // required top-level field missing → invalid
  expect(ok({ subtitle: 'x', items: [], fancy: false })).toBe(false)
  // required field present but empty → invalid
  expect(ok({ title: '', items: [], fancy: false })).toBe(false)
  // list over its max → invalid
  expect(
    ok({
      title: 'Hi',
      items: [{ name: 'a' }, { name: 'b' }, { name: 'c' }],
      fancy: false,
    })
  ).toBe(false)
  // nested required field missing → invalid
  expect(ok({ title: 'Hi', items: [{}], fancy: false })).toBe(false)
  // select value outside its options → invalid
  expect(ok({ title: 'Hi', theme: 'z', items: [], fancy: false })).toBe(false)
})

test('emptyValue seeds blanks by field kind', () => {
  expect(emptyValue(f.text('t'))).toBe('')
  expect(emptyValue(f.toggle('t'))).toBe(false)
  expect(emptyValue(f.list('l', f.text('x')))).toEqual([])
  expect(
    emptyValue(f.group('g', { a: f.text('A'), on: f.toggle('On') }))
  ).toEqual({
    a: '',
    on: false,
  })
})
