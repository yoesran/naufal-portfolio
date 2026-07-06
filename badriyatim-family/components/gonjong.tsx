import { cn } from '@/lib/utils'

// The rumah gadang roofline — three sweeping buffalo-horn peaks (gonjong), the
// family's signature motif. Decorative by default (aria-hidden); pass `label`
// when it stands in for meaning. Stroke uses currentColor, so set text-* to tint.
export function Gonjong({
  className,
  label,
}: {
  className?: string
  label?: string
}) {
  return (
    <svg
      viewBox="0 0 120 40"
      className={cn('h-auto', className)}
      fill="none"
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      <path
        d="M4 36 C16 36 20 14 26 5 C32 14 36 24 46 26 C54 24 56 11 60 3 C64 11 66 24 74 26 C84 24 88 14 94 5 C100 14 104 36 116 36"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
