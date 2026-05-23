<script lang="ts">
  import { Button } from '$lib/components/ui/button/index.js'

  let count = $state(0)
</script>

<div style="padding: 16px; border: 2px dashed #888; border-radius: 8px;">
  <p>I'm a Svelte component loaded over Module Federation.</p>
  <Button onclick={() => count++}>Count is {count}</Button>
</div>
