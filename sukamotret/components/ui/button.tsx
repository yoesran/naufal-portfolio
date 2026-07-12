import { Button as ButtonPrimitive } from '@base-ui/react/button'
import { type VariantProps, cva } from 'class-variance-authority'

import { cn } from '@/lib/utils'

// base-vega button (copied from nuansa, the repo's shadcn reference), plus a
// `chip` variant for this site's filter/look pills and `cta` sizing for the
// sketch's uppercase-tracked buttons.
const buttonVariants = cva(
  // cursor-pointer added to the base: the page mixes these with natively
  // pointer-cursored elements (frames, lightbox chrome) — a mixed cursor
  // reads as broken on a marketing page.
  "group/button inline-flex shrink-0 cursor-pointer items-center justify-center rounded-md border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/80',
        outline:
          'border-border bg-background shadow-xs hover:bg-muted hover:text-foreground',
        ghost: 'hover:bg-muted hover:text-foreground',
        // the sketch's primary CTA: ink block, uppercase, tracked
        cta: 'rounded-[2px] border-ink bg-ink px-5.5 py-3.5 text-s-1 tracking-[0.06em] text-paper uppercase hover:border-accent hover:bg-accent hover:text-paper',
        // the sketch's secondary CTA: outlined, goes accent on hover
        'cta-ghost':
          'rounded-[2px] border-ink bg-transparent px-5.5 py-3.5 text-s-1 tracking-[0.06em] text-ink uppercase hover:text-accent',
        // filter/look pills; aria-pressed carries the selected state
        chip: 'min-h-11 rounded-full border-line bg-transparent px-4 py-1.5 text-s-1 font-normal text-ink-soft aria-pressed:border-ink aria-pressed:bg-ink aria-pressed:text-paper',
      },
      size: {
        default: 'h-9 gap-1.5 px-2.5',
        auto: 'h-auto',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

function Button({
  className,
  variant = 'default',
  size = 'default',
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
