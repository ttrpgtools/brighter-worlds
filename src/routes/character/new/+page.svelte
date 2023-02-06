<script lang="ts">
  import type { Calling as CallingType } from "$lib/types";
  import MenuLink from "$lib/MenuLink.svelte";
  import callings from '$data/callings.json';
  import Calling from "./Calling.svelte";
  import { manager } from "$lib/data/sheet-manager";
  import { goto } from "$app/navigation";
  const callingList = callings as CallingType[];

  function startWizard(calling: CallingType) {
    const [newId] = manager.create('', calling);
    goto(`/character/${newId}/`);
  }
</script>
<svelte:head>
  <title>New Character :: Brighter Worlds Online</title>
</svelte:head>
<main class="p-8 flex flex-col items-center gap-2">
  <h2 class="font-title text-4xl text-center">Create a Brighter Worlds Character</h2>
  <div class="font-symbol text-6xl">A</div>
  <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
    {#each callingList as calling}
      <Calling calling={calling} on:click={() => startWizard(calling)} />
    {/each}
  </div>
  <MenuLink href="/">Home</MenuLink>
</main>