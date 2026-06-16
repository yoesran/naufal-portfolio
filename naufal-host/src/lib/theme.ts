import { useSyncExternalStore } from 'react'

import {
  ACCENTS,
  ACCENT_SWATCH,
  DEFAULTS,
  DEFAULT_RADIUS,
  FONTS,
  FONT_STACKS,
  KEYS,
  RADIUS_MAX,
  RADIUS_MIN,
  RADIUS_STEP,
  SURFACES,
  SURFACE_BG,
  SURFACE_SWATCH,
} from './theme-tokens'
import type { Accent, Font, Mode, Surface, ThemeConfig } from './theme-tokens'

// Single shared theme store. Every control (the theme-lab block) reads/writes
// the same state via useSyncExternalStore, so nothing desyncs. All five
// dimensions map to the host's <html> (class/attribute/CSS-var), so they
// cascade into the federated remotes the same way dark mode does.
//
// Data lives in ./theme-tokens (shared with the generated pre-paint script);
// re-exported here so components keep importing from '@/lib/theme'.
export {
  ACCENTS,
  ACCENT_SWATCH,
  DEFAULT_RADIUS,
  FONTS,
  FONT_STACKS,
  RADIUS_MAX,
  RADIUS_MIN,
  RADIUS_STEP,
  SURFACES,
  SURFACE_SWATCH,
}
export type { Accent, Font, Mode, Surface, ThemeConfig }

// Exported (with loadRadius below) so the unit suite can assert the real
// validation logic, not a copy. See lib/quality/units.test.ts.
export function oneOf<T extends string>(
  options: readonly T[],
  value: string | null,
  fallback: T
): T {
  return options.includes(value as T) ? (value as T) : fallback
}

function load(): ThemeConfig {
  if (typeof localStorage === 'undefined') return DEFAULTS
  return {
    mode: oneOf(
      ['light', 'dark', 'system'],
      localStorage.getItem(KEYS.mode),
      'system'
    ),
    accent: oneOf(ACCENTS, localStorage.getItem(KEYS.accent), 'emerald'),
    surface: oneOf(SURFACES, localStorage.getItem(KEYS.surface), 'default'),
    radius: loadRadius(localStorage.getItem(KEYS.radius)),
    font: oneOf(FONTS, localStorage.getItem(KEYS.font), 'inter'),
  }
}

// `radius` differs from the other axes: a stored "0" (slider at RADIUS_MIN) is a
// valid value, not "unset", so we check for an absent key before coercing — and
// clamp to the slider's range so a tampered value can't escape it.
export function loadRadius(raw: string | null): number {
  if (raw === null) return DEFAULT_RADIUS
  const n = Number(raw)
  if (!Number.isFinite(n) || n < RADIUS_MIN || n > RADIUS_MAX)
    return DEFAULT_RADIUS
  return n
}

function systemDark(): boolean {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-color-scheme: dark)').matches
  )
}

export function resolveDark(mode: Mode): boolean {
  return mode === 'dark' || (mode === 'system' && systemDark())
}

// Write the whole config onto <html>. Mirrors the generated pre-paint script
// (which handles first paint); this keeps the DOM in sync on every change after.
function apply(c: ThemeConfig) {
  if (typeof document === 'undefined') return
  const root = document.documentElement
  const dark = resolveDark(c.mode)
  root.classList.toggle('dark', dark)
  root.setAttribute('data-accent', c.accent)
  root.setAttribute('data-surface', c.surface)
  root.style.setProperty('--radius', `${c.radius}rem`)
  root.style.setProperty('--font-app', FONT_STACKS[c.font])
  root.style.backgroundColor = SURFACE_BG[c.surface][dark ? 1 : 0]
}

function persist(c: ThemeConfig) {
  if (typeof localStorage === 'undefined') return
  localStorage.setItem(KEYS.mode, c.mode)
  localStorage.setItem(KEYS.accent, c.accent)
  localStorage.setItem(KEYS.surface, c.surface)
  localStorage.setItem(KEYS.radius, String(c.radius))
  localStorage.setItem(KEYS.font, c.font)
}

let config = load()
apply(config)

const listeners = new Set<() => void>()

function emit() {
  for (const l of listeners) l()
}

function setConfig(patch: Partial<ThemeConfig>) {
  config = { ...config, ...patch }
  persist(config)
  apply(config)
  emit()
}

function reset() {
  setConfig(DEFAULTS)
}

// Re-apply when the OS theme flips while in `system` mode.
if (typeof window !== 'undefined') {
  window
    .matchMedia('(prefers-color-scheme: dark)')
    .addEventListener('change', () => {
      if (config.mode === 'system') {
        apply(config)
        emit()
      }
    })
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function getSnapshot() {
  return config
}

export function useThemeConfig() {
  const c = useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
  return {
    ...c,
    resolvedDark: resolveDark(c.mode),
    setMode: (mode: Mode) => setConfig({ mode }),
    setAccent: (accent: Accent) => setConfig({ accent }),
    setSurface: (surface: Surface) => setConfig({ surface }),
    setRadius: (radius: number) => setConfig({ radius }),
    setFont: (font: Font) => setConfig({ font }),
    reset,
  }
}
