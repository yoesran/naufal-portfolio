// Pure theme data + the pre-paint script/style generators. Deliberately has no
// React and no DOM-type references, so it can be imported from BOTH the app
// bundle (theme.ts) and vite.config.ts (Node, a tsconfig with no DOM lib).
//
// That dual-importability is the whole point: the no-FOUC inline script in the
// document <head> is GENERATED from these constants at build/serve time rather
// than hand-mirrored in index.html. Change a token here and the pre-paint
// script follows automatically — no second copy to keep in sync.

export type Mode = 'light' | 'dark' | 'system'

export const ACCENTS = ['emerald', 'blue', 'violet', 'amber', 'rose'] as const
export type Accent = (typeof ACCENTS)[number]

export const SURFACES = ['default', 'slate', 'stone', 'mono'] as const
export type Surface = (typeof SURFACES)[number]

export const FONTS = ['inter', 'system', 'mono', 'serif'] as const
export type Font = (typeof FONTS)[number]

export const RADIUS_MIN = 0
export const RADIUS_MAX = 2.5
export const RADIUS_STEP = 0.05
export const DEFAULT_RADIUS = 0.625

export const FONT_STACKS: Record<Font, string> = {
  inter: "'Inter Variable', ui-sans-serif, system-ui, sans-serif",
  system:
    "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
  mono: "ui-monospace, SFMono-Regular, 'Cascadia Code', 'Source Code Pro', Menlo, Consolas, monospace",
  serif: "ui-serif, Georgia, Cambria, 'Times New Roman', Times, serif",
}

// Representative swatches for the UI controls, kept in sync with the CSS presets.
// Accents use the dark (brighter) value; surfaces use the dark background.
export const ACCENT_SWATCH: Record<Accent, string> = {
  emerald: 'oklch(0.765 0.177 163.223)',
  blue: 'oklch(0.707 0.165 254.624)',
  violet: 'oklch(0.702 0.183 293.541)',
  amber: 'oklch(0.828 0.189 84.429)',
  rose: 'oklch(0.712 0.194 13.428)',
}

export const SURFACE_SWATCH: Record<Surface, string> = {
  default: 'oklch(0.205 0 0)',
  slate: 'oklch(0.215 0.018 265)',
  stone: 'oklch(0.216 0.007 80)',
  mono: 'oklch(0 0 0)',
}

// [light, dark] page background per surface — must match the `--background`
// values in index.css (CSS can't import this module). Used by the store's
// apply() for the <html> overscroll area and by the generated pre-paint script.
export const SURFACE_BG: Record<Surface, [string, string]> = {
  default: ['oklch(1 0 0)', 'oklch(0.145 0 0)'],
  slate: ['oklch(0.984 0.003 265)', 'oklch(0.17 0.015 265)'],
  stone: ['oklch(0.985 0.003 80)', 'oklch(0.17 0.006 80)'],
  mono: ['oklch(1 0 0)', 'oklch(0 0 0)'],
}

export type ThemeConfig = {
  mode: Mode
  accent: Accent
  surface: Surface
  radius: number
  font: Font
}

export const DEFAULTS: ThemeConfig = {
  mode: 'system',
  accent: 'emerald',
  surface: 'default',
  radius: DEFAULT_RADIUS,
  font: 'inter',
}

// localStorage keys. `mode`/`accent` map to `theme`/`accent` to match what the
// generated pre-paint script reads (it shares this very object).
export const KEYS = {
  mode: 'theme',
  accent: 'accent',
  surface: 'surface',
  radius: 'radius',
  font: 'font',
} as const

// The inline pre-paint script that runs before first paint to kill the FOUC /
// wrong-theme flash. Authored as a string (not a typed function) so this module
// needs no DOM lib; every value it depends on is interpolated from the typed
// constants above, so there is nothing to mirror by hand. Mirrors the DOM writes
// in theme.ts's apply(), but reads raw localStorage instead of a loaded config.
export function buildPrePaintScript(): string {
  const data = JSON.stringify({
    keys: KEYS,
    fontStacks: FONT_STACKS,
    surfaceBg: SURFACE_BG,
  })
  return `(function(){try{
var d=${data},root=document.documentElement,ls=localStorage;
var t=ls.getItem(d.keys.mode);
var dark=t==='dark'||((!t||t==='system')&&matchMedia('(prefers-color-scheme: dark)').matches);
if(dark)root.classList.add('dark');
var a=ls.getItem(d.keys.accent);if(a)root.setAttribute('data-accent',a);
var s=ls.getItem(d.keys.surface)||'default';if(s!=='default')root.setAttribute('data-surface',s);
var r=ls.getItem(d.keys.radius);if(r)root.style.setProperty('--radius',r+'rem');
var f=ls.getItem(d.keys.font);if(f&&d.fontStacks[f])root.style.setProperty('--font-app',d.fontStacks[f]);
var pair=d.surfaceBg[s]||d.surfaceBg.default;root.style.backgroundColor=pair[dark?1:0];
}catch(e){}})()`
}

// The companion inline <style>: the default-surface background + color-scheme
// per class, so a JS-disabled / pre-script frame still paints the right base.
export function buildPrePaintStyle(): string {
  const [light, dark] = SURFACE_BG.default
  return `html{background-color:${light};color-scheme:light}html.dark{background-color:${dark};color-scheme:dark}`
}
