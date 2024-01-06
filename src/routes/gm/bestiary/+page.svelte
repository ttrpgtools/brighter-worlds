<script lang="ts">
  import DeleteButton from "$lib/DeleteButton.svelte";
  import Disclosable from "$lib/Disclosable.svelte";
  import { getNpcInstance } from "$lib/data/encounter-manager";
  import DieSelector from "$lib/sheet/DieSelector.svelte";
  import Equipment from "$lib/sheet/Equipment.svelte";
  import type { NpcStats } from "$lib/types";
  import SidebarSection from "../SidebarSection.svelte";
  import { addNpc as addNpcToMat, getPlaymat } from "../playmat";
  import type { PageData } from "./$types";
  import { getNpcs } from "./npcs";
  
  export let data: PageData;
  let mat = getPlaymat();
  let bestiary = getNpcs();

  function createNpc() {
    bestiary.appendItem({
      id: '',
      name: '',
      notes: [],
      str: 4,
      dex: 4,
      wil: 4,
      grit: 3,
      armor: 0,
      attacks: []
    });
  }

  function addToMat(stats: NpcStats) {
    const npc = getNpcInstance(stats);
    addNpcToMat(mat, npc);
  }
</script>
<svelte:head>
  <title>Bestiary :: Brighter Worlds Online</title>
</svelte:head>
<div class="flex flex-col gap-4">
  <SidebarSection title="Custom NPCs" open addable on:click={createNpc}>
    {#each $bestiary as npc (npc.id)}
    <Disclosable overflowable short>
      <svelte:fragment slot="header">
        <input type="text" bind:value={npc.name} class="flex-1 py-1 border-0 bg-transparent" placeholder="NPC Name">
        <button type="button" on:click={() => addToMat(npc)} class="relative inline-flex items-center rounded-full bg-purple-300 dark:bg-purple-700 p-1 font-medium shadow-sm hover:bg-purple-200 dark:hover:bg-purple-800 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-900"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" class="h-4 w-4"><path fill="currentColor" d="M256 80c0-17.7-14.3-32-32-32s-32 14.3-32 32V224H48c-17.7 0-32 14.3-32 32s14.3 32 32 32H192V432c0 17.7 14.3 32 32 32s32-14.3 32-32V288H400c17.7 0 32-14.3 32-32s-14.3-32-32-32H256V80z"/></svg></button>
      </svelte:fragment>
      <div class="flex flex-col gap-4">
        <div class="flex flex-row justify-between">
          <DieSelector bind:current={npc.str} />
          <DieSelector bind:current={npc.dex} />
          <DieSelector bind:current={npc.wil} />
        </div>
        <div class="flex gap-3 items-center">
          <span>Grit:</span>
          <input type="number" name="grit" size="7" placeholder="Grit" bind:value={npc.grit} class="rounded-full dark:bg-gray-900 dark:text-white focus:ring-purple-500 focus:border-purple-500">
        </div>
        <Equipment bind:equipment={npc.attacks} bind:baseArmor={npc.armor} title="Attacks" flat />
        <div class="flex gap-4 items-center ">
          <input type="text" name="image" placeholder="Image" bind:value={npc.image} class="rounded-full dark:bg-gray-900 dark:text-white focus:ring-purple-500 focus:border-purple-500 flex-1">
          <DeleteButton size="w-3 h-3" on:confirm={() => bestiary.removeItem(npc)} />
        </div>
      </div>
    </Disclosable>
    {/each}
  </SidebarSection>
  <SidebarSection title="SRD Creatures">
    {#each data.npcs as npc, ni (npc.id)}
    <div class="flex flex-row justify-between">
      <button type="button" class="cursor-pointer" class:italic={ni === 0} on:click={() => addToMat(npc)}>{npc.name}</button>
      <span>{npc.grit} Grit</span>
    </div>
    {/each}
  </SidebarSection>
</div>