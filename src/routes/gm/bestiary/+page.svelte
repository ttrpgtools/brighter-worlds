<script lang="ts">
  import DeleteButton from '$lib/DeleteButton.svelte';
  import Disclosable from '$lib/Disclosable.svelte';
  import { getNpcInstance } from '$lib/data/encounter-manager';
  import DieSelector from '$lib/sheet/DieSelector.svelte';
  import Equipment from '$lib/sheet/Equipment.svelte';
  import type { NpcStats } from '$lib/types';
  import Button from '$lib/ui/button.svelte';
  import SidebarSection from '../SidebarSection.svelte';
  import { addNpc as addNpcToMat, getPlaymat } from '../playmat';
  import type { PageData } from './$types';
  import { getNpcs } from './npcs';

  interface Props {
    data: PageData;
  }

  let { data }: Props = $props();
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
  <SidebarSection title="Custom NPCs" open addable onclick={createNpc}>
    {#each $bestiary as npc (npc.id)}
      <Disclosable overflowable short>
        {#snippet header()}
          <input
            type="text"
            bind:value={npc.name}
            class="flex-1 py-1 border-0 bg-transparent"
            placeholder="NPC Name"
          />
          <Button
            class="border-0"
            icon="plus"
            size="tight"
            iconClass="size-4"
            onclick={() => addToMat(npc)}
          />
        {/snippet}
        <div class="flex flex-col gap-4">
          <div class="flex flex-row justify-between">
            <DieSelector bind:current={npc.str} />
            <DieSelector bind:current={npc.dex} />
            <DieSelector bind:current={npc.wil} />
          </div>
          <div class="flex gap-3 items-center">
            <span>Grit:</span>
            <input
              type="number"
              name="grit"
              size="7"
              placeholder="Grit"
              bind:value={npc.grit}
              class="rounded-full dark:bg-gray-900 dark:text-white focus:ring-purple-500 focus:border-purple-500"
            />
          </div>
          <Equipment
            bind:equipment={npc.attacks}
            bind:baseArmor={npc.armor}
            title="Attacks"
            flat
            onroll={() => {}}
            onshare={() => {}}
          />
          <div class="flex gap-4 items-center">
            <input
              type="text"
              name="image"
              placeholder="Image"
              bind:value={npc.image}
              class="rounded-full dark:bg-gray-900 dark:text-white focus:ring-purple-500 focus:border-purple-500 flex-1"
            />
            <DeleteButton size="w-3 h-3" onconfirm={() => bestiary.removeItem(npc)} />
          </div>
        </div>
      </Disclosable>
    {/each}
  </SidebarSection>
  <SidebarSection title="SRD Creatures">
    {#each data.npcs as npc, ni (npc.id)}
      <div class="flex flex-row justify-between">
        <button
          type="button"
          class="cursor-pointer"
          class:italic={ni === 0}
          onclick={() => addToMat(npc)}>{npc.name}</button
        >
        <span>{npc.grit} Grit</span>
      </div>
    {/each}
  </SidebarSection>
</div>
