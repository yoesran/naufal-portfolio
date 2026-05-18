<script lang="ts">
  let count = 0;
</script>

<div style="padding: 16px; border: 2px dashed #888; border-radius: 8px;">
  <p>I'm a Svelte component loaded over Module Federation.</p>
  <button on:click={() => count++}>Count is {count}</button>
</div>