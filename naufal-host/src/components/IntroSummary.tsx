import { useTranslation } from 'react-i18next'

import { ArrowDown } from 'lucide-react'

import { buttonVariants } from '@/components/ui/button'
import { EXPERIENCE } from '@/lib/experience'
import { BLOG_URL } from '@/lib/links'
import { cn } from '@/lib/utils'

// The comprehension layer — the plain-language rescue for a non-technical
// visitor. Sits eager (above the fold) right after the wordmark: one line of who
// / what, a "worked at" strip drawn from the real experience registry, and three
// CTAs. "Ask about me" is the assistant's discoverability launcher (scrolls to
// the `// ask` block); the others route to the readable CV / inbox. Not a Cell —
// it's orientation, not another demo.
export function IntroSummary() {
  const { t } = useTranslation()
  const companies = EXPERIENCE.map((e) => e.short).join(' · ')

  return (
    <section aria-label={t('summary.role')} className="px-1">
      <p className="text-foreground text-base leading-relaxed sm:text-lg">
        {t('summary.role')}
      </p>
      <p className="text-muted-foreground mt-2 font-mono text-xs">
        <span className="text-muted-foreground/70">
          {t('summary.workedAt')}:{' '}
        </span>
        {companies}
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <a
          href="#chat"
          className={cn(
            buttonVariants({ variant: 'default', size: 'sm' }),
            'font-mono'
          )}
        >
          {t('summary.ask')}
          <ArrowDown className="size-3.5" aria-hidden="true" />
        </a>
        <a
          href={`${BLOG_URL}/cv`}
          target="_blank"
          rel="noreferrer"
          className={cn(
            buttonVariants({ variant: 'outline', size: 'sm' }),
            'font-mono'
          )}
        >
          {t('summary.viewCv')}
          <span aria-hidden="true"> ↗</span>
        </a>
        <a
          href="mailto:naufalyoesran@gmail.com"
          className={cn(
            buttonVariants({ variant: 'ghost', size: 'sm' }),
            'font-mono'
          )}
        >
          {t('summary.contact')}
        </a>
      </div>
    </section>
  )
}
