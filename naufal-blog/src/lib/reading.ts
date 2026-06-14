'use client'

import { useSyncExternalStore } from 'react'

// Shared store for the per-post reading prefs (font / size / background), applied
// as CSS vars on <html> and surfaced on #reading by reading.css. A module store
// (like theme.ts) rather than popover-local state, so the prefs survive the
// reading popover unmounting when it closes and stay applied to <html>
// independent of any control being mounted. The no-FOUC prepaint.js mirrors this
// read for first paint.
export type Font = 'sans' | 'serif' | 'mono'
export type Bg = 'default' | 'paper' | 'sepia' | 'ink'

export const FONT_STACKS: Record<Font, string> = {
  sans: 'var(--font-sans)',
  serif: 'Georgia, Cambria, "Times New Roman", serif',
  mono: 'var(--font-mono)',
}

export const MIN_SIZE = 15
export const MAX_SIZE = 22
export const DEFAULT_SIZE = 17

type State = { font: Font; size: number; bg: Bg }

const KEYS = { font: 'reading.font', size: 'reading.size', bg: 'reading.bg' }
const DEFAULTS: State = { font: 'sans', size: DEFAULT_SIZE, bg: 'default' }

function read(): State {
  if (typeof window === 'undefined') return DEFAULTS
  const f = localStorage.getItem(KEYS.font)
  const s = Number(localStorage.getItem(KEYS.size))
  const b = localStorage.getItem(KEYS.bg)
  return {
    font: f === 'serif' || f === 'mono' || f === 'sans' ? f : 'sans',
    size: s >= MIN_SIZE && s <= MAX_SIZE ? s : DEFAULT_SIZE,
    bg: b === 'paper' || b === 'sepia' || b === 'ink' ? b : 'default',
  }
}

function apply(s: State): void {
  if (typeof document === 'undefined') return
  const de = document.documentElement
  de.style.setProperty('--reading-font', FONT_STACKS[s.font])
  de.style.setProperty('--reading-size', `${s.size}px`)
  if (s.bg === 'default') de.removeAttribute('data-reading-bg')
  else de.setAttribute('data-reading-bg', s.bg)
}

let state: State = DEFAULTS
const listeners = new Set<() => void>()

function emit() {
  for (const l of listeners) l()
}

function set(patch: Partial<State>): void {
  state = { ...state, ...patch }
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(KEYS.font, state.font)
    localStorage.setItem(KEYS.size, String(state.size))
    localStorage.setItem(KEYS.bg, state.bg)
  }
  apply(state)
  emit()
}

export function setFont(font: Font): void {
  set({ font })
}
export function setSize(size: number): void {
  set({ size })
}
export function setBg(bg: Bg): void {
  set({ bg })
}
export function resetReading(): void {
  set(DEFAULTS)
}

function subscribe(cb: () => void): () => void {
  // First subscriber syncs the in-memory state with what prepaint.js already
  // applied from storage (mirrors theme.ts).
  if (listeners.size === 0) state = read()
  listeners.add(cb)
  return () => listeners.delete(cb)
}

function snapshot(): State {
  return state
}

export function useReading(): State {
  return useSyncExternalStore(subscribe, snapshot, () => DEFAULTS)
}
