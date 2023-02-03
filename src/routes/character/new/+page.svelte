<script lang="ts">
  import MenuLink from "$lib/MenuLink.svelte";
  import callings from '$data/callings.json';
  import Calling from "./Calling.svelte";
</script>
<svelte:head>
  <title>Create a Brighter Worlds character</title>
</svelte:head>
<main class="p-8 flex flex-col items-center gap-2">
  <h2 class="font-title text-4xl text-center">Create a Brighter Worlds Character</h2>
  <div class="font-symbol text-6xl">A</div>
  <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
  {#each callings as calling}
      <Calling calling={calling} />
    {/each}
  </div>
  <MenuLink href="/">Home</MenuLink>
</main>