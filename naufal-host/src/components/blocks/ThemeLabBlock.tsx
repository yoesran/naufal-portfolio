import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

import { Monitor, Moon, RotateCcw, Sun } from 'lucide-react'

import { Cell } from '@/components/Cell'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import {
  ACCENTS,
  ACCENT_SWATCH,
  FONTS,
  FONT_STACKS,
  type Mode,
  RADIUS_MAX,
  RADIUS_MIN,
  RADIUS_STEP,
  SURFACES,
  SURFACE_SWATCH,
  useThemeConfig,
} from '@/lib/theme'
import { cn } from '@/lib/utils'

const MODE_ICON: Record<Mode, typeof Sun> = {
  light: Sun,
  dark: Moon,
  system: Monitor,
}

const ITEM =
  'text-muted-foreground data-[state=on]:text-foreground data-[state=on]:bg-muted h-7 shrink-0 gap-1.5 px-2 font-mono text-xs'

// Wide toggle groups (surface/font/base) overflow a phone-width cell, and
// ToggleGroup doesn't wrap — so scroll them horizontally instead of squishing.
const GROUP = 'max-w-full overflow-x-auto'

// Stack label-over-control on mobile; side-by-side from `sm` up.
function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col items-start gap-1.5 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
      <span className="text-muted-foreground font-mono text-xs">{label}</span>
      {children}
    </div>
  )
}

export function ThemeLabBlock() {
  const { t } = useTranslation()
  const {
    mode,
    accent,
    surface,
    radius,
    font,
    setMode,
    setAccent,
    setSurface,
    setRadius,
    setFont,
    reset,
  } = useThemeConfig()

  return (
    <Cell label="// theme-lab · re-skins host + live remote">
      <p className="text-muted-foreground text-sm leading-relaxed">
        {t('themeLab.description')}
      </p>

      <div className="mt-5 flex flex-col gap-4">
        {/* Base mode */}
        <Row label={t('themeLab.base')}>
          <ToggleGroup
            value={[mode]}
            onValueChange={(next: string[]) => {
              const v = next[0]
              if (v) setMode(v as Mode)
            }}
            spacing={0}
            aria-label={t('themeLab.base')}
            className={GROUP}
          >
            {(['light', 'dark', 'system'] as const).map((m) => {
              const Icon = MODE_ICON[m]
              return (
                <ToggleGroupItem key={m} value={m} className={ITEM}>
                  <Icon className="size-3.5" />
                  {t(`theme.${m}`)}
                </ToggleGroupItem>
              )
            })}
          </ToggleGroup>
        </Row>

        {/* Accent */}
        <Row label={t('themeLab.accent')}>
          <div className="flex gap-1.5">
            {ACCENTS.map((a) => (
              <button
                key={a}
                type="button"
                aria-label={t(`theme.accents.${a}`)}
                aria-pressed={accent === a}
                onClick={() => setAccent(a)}
                style={{ backgroundColor: ACCENT_SWATCH[a] }}
                className={cn(
                  'size-5 rounded-full transition-transform focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
                  'ring-offset-background focus-visible:ring-ring',
                  accent === a
                    ? 'ring-foreground/60 scale-110 ring-2 ring-offset-2'
                    : 'hover:scale-110'
                )}
              />
            ))}
          </div>
        </Row>

        {/* Surface */}
        <Row label={t('themeLab.surface')}>
          <ToggleGroup
            value={[surface]}
            onValueChange={(next: string[]) => {
              const v = next[0]
              if (v) setSurface(v as (typeof SURFACES)[number])
            }}
            spacing={0}
            aria-label={t('themeLab.surface')}
            className={GROUP}
          >
            {SURFACES.map((s) => (
              <ToggleGroupItem key={s} value={s} className={ITEM}>
                <span
                  aria-hidden="true"
                  className="border-border size-3 rounded-full border"
                  style={{ backgroundColor: SURFACE_SWATCH[s] }}
                />
                {t(`themeLab.surfaces.${s}`)}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </Row>

        {/* Radius */}
        <Row label={t('themeLab.radius')}>
          <div className="flex w-full items-center gap-3 sm:w-auto sm:flex-1">
            <Slider
              min={RADIUS_MIN}
              max={RADIUS_MAX}
              step={RADIUS_STEP}
              value={radius}
              onValueChange={(v) =>
                setRadius((typeof v === 'number' ? v : v[0]) ?? radius)
              }
              aria-label={t('themeLab.radius')}
              className="w-full"
            />
            <span className="text-muted-foreground w-14 shrink-0 text-right font-mono text-xs tabular-nums">
              {radius.toFixed(3).replace(/0+$/, '').replace(/\.$/, '')}rem
            </span>
          </div>
        </Row>

        {/* Font */}
        <Row label={t('themeLab.font')}>
          <ToggleGroup
            value={[font]}
            onValueChange={(next: string[]) => {
              const v = next[0]
              if (v) setFont(v as (typeof FONTS)[number])
            }}
            spacing={0}
            aria-label={t('themeLab.font')}
            className={GROUP}
          >
            {FONTS.map((f) => (
              <ToggleGroupItem
                key={f}
                value={f}
                className={ITEM}
                style={{ fontFamily: FONT_STACKS[f] }}
              >
                {t(`themeLab.fonts.${f}`)}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </Row>
      </div>

      <div className="mt-5 flex justify-end">
        <Button variant="ghost" size="sm" onClick={reset} className="gap-1.5">
          <RotateCcw className="size-3.5" />
          {t('themeLab.reset')}
        </Button>
      </div>
    </Cell>
  )
}
