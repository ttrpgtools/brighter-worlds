<script lang="ts">
  import MenuLink from "$lib/MenuLink.svelte";
  import RollableTable from "$lib/RollableTable.svelte";
  import type { TableRoll } from "$lib/types";
  const opts = ['Sword', 'Axe', 'Spear', 'Glaive', 'Dagger', 'Whip'];
  const adjs = ['Scratched', 'Fun', 'Flimsy', 'Rusty', 'Shiny', 'Vicious'];
  function show(ev: CustomEvent<TableRoll<string>>) {
    alert(ev.detail.value);
  }
</script>
<svelte:head>
  <title>Dream Academy :: Brighter Worlds Online</title>
</svelte:head>
<main class="p-8 flex flex-col items-center gap-2">
  <h2 class="font-title text-4xl text-center">Pick your stuff</h2>
  <div class="font-symbol text-6xl">A</div>
  <div class="flex justify-center gap-4">
    <div class="w-96">
      <RollableTable options={adjs} title="Adjectives" on:roll={show} />
    </div>
    <div class="w-96">
      <RollableTable options={opts} title="Weapons" on:roll={show} />
    </div>
  </div>
  <MenuLink href="/">Home</MenuLink>
</main>