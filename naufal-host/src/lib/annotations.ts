import type { Translations } from '@/lib/i18n'

// Canvas-mode callouts — Figma-style annotations that sit in the margins beside
// the site ribbon and detail the interactions play mode keeps quiet (the hero
// repel, the orbit, the live federation, the git terminal). Data-driven and
// keyed to each block's DOM `id` (set on its Cell) so a leader line can point at
// the real element — keeping them from drifting when a block moves or resizes.
// Copy lives in i18n (`canvas.notes.<key>`); only structure is here.

// Constrained to the keys that actually exist under `canvas.notes`, so the
// dynamic `t(`canvas.notes.${key}.title`)` stays type-checked.
export type NoteKey = keyof Translations['canvas']['notes']

type Annotation = {
  anchor: string // the target block's Cell id
  side: 'left' | 'right'
  key: NoteKey
}

export const ANNOTATIONS: Annotation[] = [
  { anchor: 'hero', side: 'left', key: 'hero' },
  { anchor: 'tech-stack', side: 'right', key: 'techStack' },
  { anchor: 'live-remote', side: 'left', key: 'liveRemote' },
  { anchor: 'experience', side: 'right', key: 'experience' },
  { anchor: 'quality', side: 'left', key: 'quality' },
]
