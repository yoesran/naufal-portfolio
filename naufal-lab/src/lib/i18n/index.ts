import { _, addMessages, init, locale } from 'svelte-i18n'
import { type Readable, derived } from 'svelte/store'

import en from './en.json'
import id from './id.json'

// Locale-shape parity guard (mirrors the host's `i18n.ts` approach). `Shape<T>`
// widens every string leaf to `string` so only key *structure* is compared, not
// the translated values. Asserting both directions catches a missing key in
// `id` (would silently fall back to English) AND an extra key in `id` (drift).
type Shape<T> = T extends string
  ? string
  : T extends object
    ? { [K in keyof T]: Shape<T[K]> }
    : T

en satisfies Shape<typeof id>
id satisfies Shape<typeof en>

// `addMessages` is synchronous, so the dictionaries ship inside the federated
// chunk and `$_` formats immediately on first render — no async `register()`
// flash where keys briefly show through.
addMessages('en', en)
addMessages('id', id)

const SUPPORTED = ['en', 'id'] as const
type Lang = (typeof SUPPORTED)[number]

// The host owns `<html lang>` (its i18n sets it on every `languageChanged`).
// When embedded, the remote shares the host's document, so this reads the host
// locale; standalone, it reads the lab's own index.html (`en`).
function fromHtmlLang(): Lang {
  const lang = document.documentElement.lang
  return (SUPPORTED as readonly string[]).includes(lang) ? (lang as Lang) : 'en'
}

init({ fallbackLocale: 'en', initialLocale: fromHtmlLang() })

// Live-sync without a remount: react to host locale changes so the Presence
// socket and its cursors survive a language switch. A second eval (if the two
// exposed chunks don't share this module) only attaches a redundant observer
// that sets the same value — harmless.
if (typeof MutationObserver !== 'undefined') {
  new MutationObserver(() => locale.set(fromHtmlLang())).observe(
    document.documentElement,
    { attributes: true, attributeFilter: ['lang'] }
  )
}

// Dotted union of every string-leaf key path in the dictionary — `en` is the
// source of truth (parity with `id` is enforced by the `satisfies` above). This
// drives editor autocomplete and a compile error on unknown keys.
type Join<P extends string, K extends string> = P extends '' ? K : `${P}.${K}`
type Paths<T, P extends string = ''> = {
  [K in keyof T & string]: T[K] extends string
    ? Join<P, K>
    : Paths<T[K], Join<P, K>>
}[keyof T & string]

export type MessageKey = Paths<typeof en>

// Formatter type recovered from the exported `_` store (svelte-i18n doesn't
// export its `MessageFormatter` alias). Lets us preserve the real `options`
// signature (`values`, `default`, …) on the typed wrapper below.
type Formatter = typeof _ extends Readable<infer F> ? F : never

// Typed wrapper around svelte-i18n's `_` formatter store. Components use `$t`
// instead of `$_`: identical runtime behaviour, but the key is constrained to
// `MessageKey`, so `$t('counter.nope')` fails to compile and the editor suggests
// valid paths — the svelte-i18n analogue of the host's i18next key typing.
export const t = derived(
  _,
  ($format) =>
    (id: MessageKey, options?: Parameters<Formatter>[1]): string =>
      $format(id, options)
)
