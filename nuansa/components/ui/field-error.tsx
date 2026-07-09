import type { FieldError as RHFFieldError } from 'react-hook-form'

interface FieldErrorProps {
  error?: RHFFieldError
}

/**
 * Renders a single React Hook Form field error message.
 * Returns null when there is no error, so it's always safe to render inline.
 */
export function FieldError({ error }: FieldErrorProps) {
  if (!error?.message) return null

  return (
    <p
      className="mt-1 text-xs text-destructive"
      role="alert"
      aria-live="polite"
    >
      {error.message}
    </p>
  )
}
