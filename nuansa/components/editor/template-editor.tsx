'use client'

import { useMemo, useState } from 'react'
import { FormProvider, useForm } from 'react-hook-form'

import { zodResolver } from '@hookform/resolvers/zod'

import { SectionManager } from '@/components/editor/section-manager'
import { TemplatePreview } from '@/components/editor/template-preview'
import { GeneratedForm } from '@/components/form/generated-form'
import { SITE_CONTRACT, seedSite, siteSchema } from '@/lib/site'
import { SHELLS } from '@/shells'
import { TEMPLATES } from '@/templates'

// templateId is guaranteed valid by the route (notFound otherwise). The preset
// and shell are looked up here rather than passed in, because a shell's
// components can't cross the server→client boundary.
export function TemplateEditor({ templateId }: { templateId: string }) {
  const preset = TEMPLATES[templateId]
  const shell = SHELLS[preset.shellId]

  const schema = useMemo(() => siteSchema(shell), [shell])
  // Seed once: re-seeding on every render would mint new section keys.
  const [defaultValues] = useState(() => seedSite(preset))

  const methods = useForm({
    resolver: zodResolver(schema),
    mode: 'onChange',
    defaultValues,
  })

  return (
    <FormProvider {...methods}>
      <div className="grid h-screen grid-cols-1 md:grid-cols-2">
        <div className="overflow-y-auto border-r bg-background p-6">
          <header className="mb-6">
            <h1 className="text-lg font-semibold tracking-tight">
              {preset.name}
            </h1>
            <p className="text-sm text-muted-foreground">{shell.name}</p>
          </header>

          {/* Site-wide settings go through the same generator as sections —
              nothing in the editor builds a control by hand. */}
          <div className="mb-6">
            <GeneratedForm contract={SITE_CONTRACT} />
          </div>

          <SectionManager shell={shell} />
        </div>

        <div className="hidden overflow-y-auto bg-muted/20 md:block">
          <TemplatePreview shellId={shell.id} defaultValue={defaultValues} />
        </div>
      </div>
    </FormProvider>
  )
}
