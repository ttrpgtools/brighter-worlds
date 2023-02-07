<script lang="ts">
  import MenuLink from "$lib/MenuLink.svelte";
  import { magicManager } from '$lib/data/magic-manager';
  import Magic from "./Magic.svelte";
  const spells = magicManager.spells;
  const rituals = magicManager.rituals;
</script>
<svelte:head>
  <title>Magna Arcana :: Brighter Worlds Online</title>
</svelte:head>
<main class="p-8 flex flex-col items-center gap-2">
  <h2 class="font-title text-4xl text-center">The Magic of Brighter Worlds</h2>
  <div class="font-symbol text-6xl">A</div>
  <h3 class="font-subtitle text-3xl mb-4 text-purple-800 dark:text-purple-300">Spells</h3>
  <div class="max-w-prose mb-6">
    {#each $spells as spell}
    <Magic magic={spell} />
    {/each}
  </div>
  <h3 class="font-subtitle text-3xl mb-4 text-purple-800 dark:text-purple-300">Rituals</h3>
  <div class="max-w-prose mb-6">
    {#each $rituals as ritual}
    <Magic magic={ritual} />
    {/each}
  </div>
  <MenuLink href="/">Home</MenuLink>
</main>