import { Button as ButtonPrimitive } from '@base-ui/react/button'
import { type VariantProps, cva } from 'class-variance-authority'

import { cn } from '@/lib/utils'

// base-vega button (copied from sukamotret, the repo's shadcn lineage), with
// this brand's variants: `cta` is the poster-blue block in the display
// italic, `chip` is the mono filter pill (selected state rides aria-pressed).
const buttonVariants = cva(
  // cursor-pointer added to the base: the page mixes these with natively
  // pointer-cursored elements (links, the draggable gerobak) — a mixed cursor
  // reads as broken on a marketing page.
  "group/button inline-flex shrink-0 cursor-pointer items-center justify-center rounded-md border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/80',
        outline:
          'border-border bg-background shadow-xs hover:bg-muted hover:text-foreground',
        ghost: 'hover:bg-muted hover:text-foreground',
        // V6 primary CTA: amber block, sharp corners, ink frame, press-down
        // shadow (translate eats the shadow when you push it)
        cta: 'rounded-none border-3 border-tinta bg-amber px-5 py-2.5 font-display text-s0 tracking-[0.04em] text-tinta uppercase italic shadow-[4px_4px_0_var(--night)] transition-[translate,box-shadow] duration-100 hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[1px_1px_0_var(--night)]',
        // ghost CTA: transparent, frame follows the ground's text colour
        'cta-ghost':
          'rounded-none border-3 border-current bg-transparent px-5 py-2.5 font-display text-s0 tracking-[0.04em] text-ink uppercase italic shadow-[4px_4px_0_var(--night)] transition-[translate,box-shadow] duration-100 hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[1px_1px_0_var(--night)]',
        // pressable sticker pills; aria-pressed physically sinks them
        chip: 'min-h-11 rounded-full border-[2.5px] border-tinta bg-panel px-4 py-1.5 font-mono text-[0.74rem] font-bold text-tinta shadow-[3px_3px_0_var(--night)] transition-[translate,box-shadow] duration-100 hover:-translate-x-px hover:-translate-y-px hover:shadow-[4px_4px_0_var(--night)] aria-pressed:translate-x-0.5 aria-pressed:translate-y-0.5 aria-pressed:bg-amber aria-pressed:shadow-[1px_1px_0_var(--night)]',
      },
      size: {
        default: 'h-9 gap-1.5 px-2.5',
        auto: 'h-auto',
        // ui/dialog's built-in close button asks for this size
        'icon-sm': 'size-11',
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
