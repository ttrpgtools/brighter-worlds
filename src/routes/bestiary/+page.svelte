<script lang="ts">
  import Beast from "$lib/entities/Beast.svelte";
  import MenuLink from "$lib/MenuLink.svelte";
  import type { PageData } from "./$types";
  
  export let data: PageData;
</script>
<svelte:head>
  <title>Bestiary :: Brighter Worlds Online</title>
</svelte:head>
<main class="p-4 sm:p-8 flex flex-col items-center gap-2">
  <h2 class="font-title text-4xl text-center">The Creatures of Brighter Worlds</h2>
  <div class="font-symbol text-6xl">A</div>
  <div class="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-6 mb-6">
    {#each data.npcs as npc}
    <Beast stats={npc} />
    {/each}
  </div>
  <MenuLink href="/">Home</MenuLink>
</main>