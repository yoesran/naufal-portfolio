'use client'

// Horizontally scrollable region that starts centred instead of at the left
// edge — the org chart's trunk sits in the middle of a w-max child, so scroll
// position 0 shows half a chart on small screens. Ref callback (not an effect):
// runs once on mount, React-Compiler-clean.
export function CenterScroll({
  className,
  children,
}: {
  className?: string
  children: React.ReactNode
}) {
  return (
    <div
      className={className}
      ref={(el) => {
        if (el) el.scrollLeft = (el.scrollWidth - el.clientWidth) / 2
      }}
    >
      {children}
    </div>
  )
}
