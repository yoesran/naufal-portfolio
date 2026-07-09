import Link from 'next/link'

import { TEMPLATES } from '@/templates'

// Plain template index — the entry point into the editor. The real gallery
// (live demo-content previews, "use this template" → a new site) is MVP step 4;
// this is the smallest thing that makes the app navigable.
export default function Page() {
  return (
    <main className="mx-auto max-w-2xl p-8">
      <h1 className="text-2xl font-semibold tracking-tight">Nuansa</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Pilih template, lalu isi kontennya.
      </p>

      <ul className="mt-8 space-y-3">
        {Object.values(TEMPLATES).map((template) => (
          <li key={template.id}>
            <Link
              href={`/editor/${template.id}`}
              className="block rounded-lg border p-4 transition-colors hover:bg-muted/40"
            >
              <span className="font-medium">{template.name}</span>
              <p className="mt-1 text-sm text-muted-foreground">
                {template.description}
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  )
}
