export function PageHeading({
  eyebrow,
  title,
  intro,
}: {
  eyebrow?: string
  title: string
  intro?: string
}) {
  return (
    <div className="mb-8">
      {eyebrow && (
        <p className="text-marun-soft mb-2 text-sm font-semibold tracking-wide uppercase">
          {eyebrow}
        </p>
      )}
      <h1 className="font-heading text-marun text-3xl font-semibold sm:text-4xl">
        {title}
      </h1>
      <div className="hairline-emas mt-4 w-24" />
      {intro && <p className="text-tanah-soft mt-4 max-w-2xl">{intro}</p>}
    </div>
  )
}
