/**
 * The section library — one file per section, contracts only. A section never
 * decides how it looks; that's the shell's job. Adding a section kind here makes
 * it available to any shell that writes a renderer for it.
 *
 * To add one: create `sections/<id>.ts`, then list it in `ALL` below.
 */
import type { AnySection } from '@/lib/sections'

import { countdown } from './countdown'
import { couple } from './couple'
import { cover } from './cover'
import { event } from './event'
import { gallery } from './gallery'
import { gift } from './gift'
import { maps } from './maps'
import { quotes } from './quotes'
import { thanks } from './thanks'

export * from './countdown'
export * from './couple'
export * from './cover'
export * from './event'
export * from './gallery'
export * from './gift'
export * from './maps'
export * from './quotes'
export * from './thanks'

const ALL = [
  cover,
  quotes,
  couple,
  event,
  maps,
  countdown,
  gift,
  thanks,
  gallery,
]

export const SECTIONS: Record<string, AnySection> = Object.fromEntries(
  ALL.map((section) => [section.id, section])
)
