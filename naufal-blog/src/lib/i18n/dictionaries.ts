import type { Locale } from "./config";
import en from "./dictionaries/en.json";
import id from "./dictionaries/id.json";

// `LocaleShape` widens every string leaf to `string` so cross-locale key parity
// can be checked structurally — JSON imports carry literal values that differ
// per language, which would otherwise look "different" at the type level.
// (Same approach as naufal-host's i18n.ts and naufal-lab's i18n.)
type LocaleShape<T> = T extends string
  ? string
  : T extends object
    ? { [K in keyof T]: LocaleShape<T[K]> }
    : T;

// Dual `satisfies` enforces en/id key parity at build time. Both directions are
// needed because TS only runs excess-property checks on object literals, not on
// JSON-import bindings:
// - `id satisfies LocaleShape<typeof en>` catches keys missing from id (would
//   silently fall back to en at runtime).
// - `en satisfies LocaleShape<typeof id>` catches extra keys in id (drift).
const dictionaries = {
  en: en satisfies LocaleShape<typeof id>,
  id: id satisfies LocaleShape<typeof en>,
} as const;

// The English shape is the source of truth for every key; `dict.foo.bar` access
// in components is type-checked + autocompleted against it. Exported so callers
// can derive key unions (e.g. `keyof Dictionary["nav"]`).
export type Dictionary = typeof en;

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale];
}
