<script lang="ts">
  import { t } from '$lib/i18n'

  import Counter from './lib/Counter.svelte'
  import Presence from './lib/Presence.svelte'

  // The standalone page owns its own party host (the host passes one via opts
  // when embedded). undefined in dev → Presence falls back to its localhost
  // default; set via .env.production for the deployed standalone page.
  const partyHost = import.meta.env.VITE_PARTY_HOST
</script>

<main class="bg-background text-foreground min-h-dvh">
  <div class="mx-auto max-w-2xl px-6 py-16">
    <header class="mb-8">
      <p class="text-muted-foreground font-mono text-xs">
        naufal-lab · Svelte 5 + Vite
      </p>
      <h1 class="mt-2 text-2xl font-semibold">{$t('app.title')}</h1>
      <p class="text-muted-foreground mt-3 text-sm leading-relaxed">
        {$t('app.descriptionPre')}
        <code class="text-foreground font-mono">remoteEntry.js</code>.
      </p>
    </header>

    <div class="space-y-6">
      <section class="border-border bg-card rounded-xl border p-5 shadow-sm">
        <div class="text-muted-foreground mb-3 font-mono text-xs">
          // exposed: ./Counter
        </div>
        <Counter context="standalone" />
      </section>

      <section class="border-border bg-card rounded-xl border p-5 shadow-sm">
        <div class="text-muted-foreground mb-3 font-mono text-xs">
          // exposed: ./Presence
        </div>
        <Presence host={partyHost} context="standalone" />
      </section>
    </div>
  </div>
</main>
