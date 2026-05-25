<script lang="ts">
  import Counter from './lib/Counter.svelte'
  import Presence from './lib/Presence.svelte'
</script>

<main class="bg-background text-foreground min-h-dvh">
  <div class="mx-auto max-w-2xl px-6 py-16">
    <header class="mb-8">
      <p class="text-muted-foreground font-mono text-xs">
        naufal-lab · Svelte 5 + Vite
      </p>
      <h1 class="mt-2 text-2xl font-semibold">Module Federation remote</h1>
      <p class="text-muted-foreground mt-3 text-sm leading-relaxed">
        This is a standalone Svelte app. The components below are exposed over
        Module Federation and loaded at runtime by the React host — the exact
        same code, served from this app's
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
        <Presence context="standalone" />
      </section>
    </div>
  </div>
</main>
