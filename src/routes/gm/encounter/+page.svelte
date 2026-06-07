<script lang="ts">
  import type { Encounter } from '$lib/types';
  import { encounters } from '$lib/data/encounter-manager';
  import { onMount } from 'svelte';
  import type { PageData } from './$types';
  import AutoTextarea from '$lib/AutoTextarea.svelte';
  import NpcDialog from './NpcDialog.svelte';
  import { append } from '$lib/util/array';
  import DeleteButton from '$lib/DeleteButton.svelte';
  import Button from '$lib/ui/button.svelte';
  import Icon from '$lib/ui/icon.svelte';
  import { getEncounterStates } from '$lib/data/ui-state';
  import Disclosable from '$lib/Disclosable.svelte';
  import { addEncounter as addEncounterToMat, getPlaymat } from '../playmat';
  import { getNpcs } from '../bestiary/npcs';

  const encounterStates = getEncounterStates();
  interface Props {
    data: PageData;
  }

  let { data }: Props = $props();

  let npcDialog: NpcDialog | undefined = $state();

  const list = encounters.list;
  const mat = getPlaymat();
  const bestiary = getNpcs();

  let allNpcs = $derived(data.npcs.concat($bestiary));

  let loading = $state(true);

  onMount(async () => {
    loading = false;
  });

  function addEncounter() {
    encounters.create();
  }

  function removeEncounter(eid: string) {
    $list = $list.filter((x) => x.id !== eid);
    const { [eid]: estate, ...rest } = $encounterStates;
    $encounterStates = rest;
  }

  function removeNpc(nid: string, eid: number) {
    $list[eid].npcs = $list[eid].npcs.filter((x) => x.id !== nid);
  }

  async function addNpc(encounter: number) {
    const stats = await npcDialog?.select();
    if (stats) {
      const copy = $state(structuredClone($state.snapshot(stats)));
      $list[encounter].npcs = append($list[encounter].npcs, copy);
    }
  }

  function addToMat(encounter: Encounter) {
    addEncounterToMat(mat, encounter);
  }
</script>

<svelte:head>
  <title>Encounters :: Brighter Worlds Online</title>
</svelte:head>
<NpcDialog npcList={allNpcs} bind:this={npcDialog} />

<aside class="flex flex-col gap-4 w-full">
  <div class="flex flex-col gap-4 w-full max-w-4xl">
    {#each $list as encounter, eindex}
      <Disclosable
        short
        bind:open={
          () => $encounterStates[encounter.id] ?? false, (v) => ($encounterStates[encounter.id] = v)
        }
      >
        {#snippet header()}
          <div class="pr-2">
            <h3 class="text-xl font-subtitle leading-6">{encounter.name || `(unnamed)`}</h3>
          </div>
          <div class="shrink-0 ml-auto">
            <DeleteButton onconfirm={() => removeEncounter(encounter.id)} size="w-3 h-3" />
          </div>
        {/snippet}
        <div class="flex flex-col gap-4">
          <input
            type="text"
            placeholder="Name"
            bind:value={encounter.name}
            class="rounded-full dark:bg-gray-900 dark:text-white focus:ring-purple-500 focus:border-purple-500"
          />
          <div class="mx-2">
            <AutoTextarea bind:value={encounter.desc} maxRows={12} minRows={3}></AutoTextarea>
          </div>
          <div
            class="flex items-center gap-4 justify-between border-b border-gray-200 dark:border-gray-600"
          >
            <h3 class="text-lg font-bold">NPCs</h3>
            <div>
              <Button
                class="border-0"
                icon="plus"
                size="tight"
                iconClass="size-4"
                onclick={() => addNpc(eindex)}
              />
            </div>
          </div>
          {#each encounter.npcs as npc}
            <div class="flex flex-row justify-between relative group/npc">
              <div class="">{npc.name}</div>
              <span>{npc.grit} Grit</span>
              <button
                type="button"
                onclick={() => removeNpc(npc.id, eindex)}
                class="hidden absolute top-1/2 -translate-y-1/2 right-0 text-lg rounded-full leading-none h-6 w-6 bg-purple-300 dark:bg-purple-900 group-hover/npc:flex items-center justify-center"
                ><span class="relative -top-px">&times;</span></button
              >
            </div>
          {/each}
          <div class="text-center">
            <Button onclick={() => addToMat(encounter)}>Add to Mat</Button>
          </div>
        </div>
      </Disclosable>
    {:else}
      <div class="flex items-center justify-center gap-3 text-gray-500 dark:text-gray-400">
        <Icon icon="nav-encounter" />
        {#if loading}Loading...{:else}No Encounters{/if}
      </div>
    {/each}

    <div class="text-center">
      <Button onclick={addEncounter} icon="add-encounter">Add Encounter</Button>
    </div>
  </div>
</aside>
