<script lang="ts">
  import { getNpcInstance } from "$lib/data/encounter-manager";
  import type { NpcStats } from "$lib/types";
  import SidebarSection from "../SidebarSection.svelte";
  import { addNpc, getPlaymat } from "../playmat";
  import type { PageData } from "./$types";
  
  export let data: PageData;
  let mat = getPlaymat();

  function addToMat(stats: NpcStats) {
    const npc = getNpcInstance(stats);
    addNpc(mat, npc);
  }
</script>
<svelte:head>
  <title>Bestiary :: Brighter Worlds Online</title>
</svelte:head>
<div class="flex flex-col gap-4">
  <SidebarSection title="SRD Creatures" open>

    {#each data.npcs as npc}
    <div class="flex flex-row justify-between">
      <button type="button" class="cursor-pointer" on:click={() => addToMat(npc)}>{npc.name}</button>
      <span>{npc.grit} Grit</span>
    </div>
    {/each}
  </SidebarSection>
</div>