<script lang="ts">
  import type { Encounter } from '$lib/types';
  import { getEncounters } from '$lib/data/encounter-manager';
  import type { PageData } from './$types';
  import EncounterDialog from './EncounterDialog.svelte';
  import SidebarSection from '../SidebarSection.svelte';
  import LibraryEntry from '../LibraryEntry.svelte';
  import { getEncounterStates } from '$lib/data/ui-state';
  import { addEncounter as addEncounterToMat, getPlaymat } from '../playmat';
  import { getNpcs } from '../bestiary/npcs';

  let { data }: { data: PageData } = $props();
  const encounters = getEncounters();
  const list = encounters.list;
  const mat = getPlaymat();
  const bestiary = getNpcs();
  const encounterStates = getEncounterStates();
  let allNpcs = $derived(data.npcs.concat(bestiary.items));
  let editor: EncounterDialog | undefined = $state();

  async function editEncounter(existing?: Encounter) {
    const saved = await editor?.edit(existing);
    if (saved) encounters.save(saved);
  }

  function removeEncounter(encounter: Encounter) {
    encounters.deleteEncounter(encounter.id);
    const { [encounter.id]: _removed, ...rest } = $encounterStates;
    $encounterStates = rest;
  }
</script>

<svelte:head><title>Encounters :: Brighter Worlds Online</title></svelte:head>
<EncounterDialog bind:this={editor} npcList={allNpcs} />
<div class="flex flex-col gap-4">
  <SidebarSection title="Custom Encounters" open addable onclick={() => editEncounter()}>
    {#each list.items as encounter (encounter.id)}
      <LibraryEntry
        name={encounter.name}
        kind="encounter"
        onedit={() => editEncounter(encounter)}
        onadd={() => addEncounterToMat(mat, encounter)}
        ondelete={() => removeEncounter(encounter)}
      />
    {:else}<p class="text-sm text-gray-500 dark:text-gray-400">
        {list.ready ? 'No encounters yet.' : 'Loading…'}
      </p>{/each}
  </SidebarSection>
</div>
