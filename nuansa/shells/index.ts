import type { Shell } from '@/lib/shells'

import { alurShell } from './alur'
import { kupuShell } from './kupu'

export const SHELLS: Record<string, Shell> = {
  [kupuShell.id]: kupuShell,
  [alurShell.id]: alurShell,
}
