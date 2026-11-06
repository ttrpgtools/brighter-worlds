<script lang="ts">
  import LibraryEntry from '../LibraryEntry.svelte';
  import NpcEditorDialog from '../NpcEditorDialog.svelte';
  import { getNpcInstance } from '$lib/data/encounter-manager';
  import type { NpcStats } from '$lib/types';
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

  let npcDialog: NpcEditorDialog | undefined = $state();

  async function createNpc() {
    const npc = await npcDialog?.edit();
    if (npc) bestiary.appendItem(npc);
  }

  async function editNpc(existing: NpcStats) {
    const npc = await npcDialog?.edit(existing);
    if (npc) bestiary.updateItem(npc);
  }

  function addToMat(stats: NpcStats) {
    const npc = getNpcInstance(stats);
    addNpcToMat(mat, npc);
  }
</script>

<svelte:head>
  <title>Bestiary :: Brighter Worlds Online</title>
</svelte:head>
<NpcEditorDialog bind:this={npcDialog} />
<div class="flex flex-col gap-4">
  <SidebarSection title="Custom NPCs" open addable onclick={createNpc}>
    {#each bestiary.items as npc (npc.id)}
      <LibraryEntry
        name={npc.name}
        kind="NPC"
        onedit={() => editNpc(npc)}
        onadd={() => addToMat(npc)}
        ondelete={() => bestiary.removeItem(npc)}
      />
    {/each}
  </SidebarSection>
  <SidebarSection title="SRD Creatures">
    {#each data.npcs as npc, ni (npc.id)}
      <div class="flex flex-row justify-between">
        <button
          type="button"
          class={['cursor-pointer', { italic: ni === 0 }]}
          onclick={() => addToMat(npc)}>{npc.name}</button
        >
        <span>{npc.grit} Grit</span>
      </div>
    {/each}
  </SidebarSection>
</div>
