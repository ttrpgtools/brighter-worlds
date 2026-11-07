<script lang="ts">
  import { resolve } from '$app/paths';
  let { feature }: { feature: string } = $props();
</script>

<svelte:head><title>{feature} retired · Brighter Worlds</title></svelte:head>
<main class="mx-auto max-w-xl px-6 py-16 space-y-6">
  <h1 class="font-title text-3xl">{feature} has been retired</h1>
  <p>Character sheets, GM tools, Discord sharing and item links are still available.</p>
  <p>
    This change does not remove saved browser data. Use the backup tools on the character list to
    download your characters and game data, including saved activity logs.
  </p>
  <nav class="flex flex-wrap gap-6 text-purple-700 dark:text-purple-300 underline">
    <a href={resolve('/character')}>Characters and backups</a>
    <a href={resolve('/gm')}>GM tools</a>
  </nav>
</main>
