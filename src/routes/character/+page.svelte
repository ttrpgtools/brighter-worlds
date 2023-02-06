<script lang="ts">
  import { manager } from "$lib/data/sheet-manager";
  import MenuLink from "$lib/MenuLink.svelte";
  import { onMount } from "svelte";

  const list = manager.list;
  onMount(() => {
    manager.loadList();
  });
</script>
<svelte:head>
  <title>Your Characters :: Brighter Worlds Online</title>
</svelte:head>
<main class="p-8 flex flex-col items-center gap-2">
  <h2 class="font-title text-4xl text-center">Choose Your Adventurer</h2>
  <div class="font-symbol text-6xl">A</div>
  <div class="text-center grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
    {#each $list as sheet}
      <MenuLink href={`/character/${sheet.id}/`}>{sheet.name || '?'} ({sheet.calling || '?'})</MenuLink>
    {:else}
      <div></div>
      <div>No characters saved.</div>
    {/each}
  </div>
  <div class="font-symbol text-5xl">P</div>
  <MenuLink href="/character/new">Create A New Character</MenuLink>
  <MenuLink href="/">Home</MenuLink>
</main>