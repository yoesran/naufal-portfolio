/**
 * Original ornament for the Kupu shell — stylised botanical sprigs and
 * butterflies drawn as inline SVG. Deliberately zero image assets: no
 * licensing exposure in a public repo, nothing to upload, and it scales
 * crisply. Everything inherits `currentColor`, so the shell tints it.
 *
 * Purely decorative → `aria-hidden`, and never interactive.
 */

/** A leafy stem with a small flower cluster at the tip. */
function Sprig({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 120" fill="none" aria-hidden className={className}>
      <path
        d="M8 112C28 86 44 60 58 24"
        stroke="currentColor"
        strokeOpacity=".45"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <g fill="currentColor" fillOpacity=".26">
        <ellipse cx="24" cy="86" rx="12" ry="5" transform="rotate(-35 24 86)" />
        <ellipse
          cx="36"
          cy="70"
          rx="13"
          ry="5.5"
          transform="rotate(-30 36 70)"
        />
        <ellipse cx="46" cy="52" rx="12" ry="5" transform="rotate(-25 46 52)" />
        <ellipse
          cx="16"
          cy="96"
          rx="10"
          ry="4.5"
          transform="rotate(30 16 96)"
        />
        <ellipse cx="30" cy="78" rx="11" ry="5" transform="rotate(35 30 78)" />
        <ellipse
          cx="42"
          cy="60"
          rx="10"
          ry="4.5"
          transform="rotate(40 42 60)"
        />
      </g>
      <g fill="currentColor" fillOpacity=".5">
        <circle cx="58" cy="22" r="5" />
        <circle cx="49" cy="32" r="3.5" />
        <circle cx="67" cy="30" r="3" />
      </g>
    </svg>
  )
}

function Butterfly({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 32" fill="none" aria-hidden className={className}>
      <path
        d="M20 16C20 16 8 2 4 8s6 12 16 8Z"
        fill="currentColor"
        fillOpacity=".4"
      />
      <path
        d="M20 16C20 16 32 2 36 8s-6 12-16 8Z"
        fill="currentColor"
        fillOpacity=".4"
      />
      <path
        d="M20 16C20 16 10 26 14 30s6-6 6-14Z"
        fill="currentColor"
        fillOpacity=".26"
      />
      <path
        d="M20 16C20 16 30 26 26 30s-6-6-6-14Z"
        fill="currentColor"
        fillOpacity=".26"
      />
      <ellipse
        cx="20"
        cy="17"
        rx="1.3"
        ry="6"
        fill="currentColor"
        fillOpacity=".65"
      />
    </svg>
  )
}

/**
 * The full decorative frame: an arch-shaped card, sprigs at each corner, and a
 * pair of butterflies. Sits above the card but below the content.
 */
export function Frame() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 overflow-hidden text-(--kupu-soft)"
    >
      {/* the arch the content sits on */}
      <div className="absolute inset-x-5 top-6 bottom-24 rounded-t-[999px] bg-(--kupu-card)" />

      <Sprig className="absolute -top-2 -left-4 h-40 w-40" />
      <Sprig className="absolute -top-2 -right-4 h-40 w-40 -scale-x-100" />
      <Sprig className="absolute right-2 bottom-20 h-32 w-32 -scale-y-100" />
      <Sprig className="absolute bottom-20 -left-2 h-32 w-32 -scale-100" />

      <Butterfly className="absolute top-32 left-8 h-6 w-8" />
      <Butterfly className="absolute top-56 right-10 h-5 w-6" />
    </div>
  )
}
