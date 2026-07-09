import { notFound } from 'next/navigation'

import { TemplateEditor } from '@/components/editor/template-editor'
import { SHELLS } from '@/shells'
import { TEMPLATES } from '@/templates'

type PageProps = {
  params: Promise<{ template: string }>
}

export default async function EditorPage({ params }: PageProps) {
  const { template } = await params
  const preset = TEMPLATES[template]
  // Guard the shell too: a preset naming a shell that no longer exists would
  // otherwise crash inside the client editor rather than 404 here.
  if (!preset || !SHELLS[preset.shellId]) notFound()

  return <TemplateEditor templateId={template} />
}
