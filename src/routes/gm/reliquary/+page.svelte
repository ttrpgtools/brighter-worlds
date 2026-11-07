<script lang="ts">
  import { rollFormula } from '$lib/rolling/roll';
  import EquipmentDialog from '$lib/sheet/EquipmentDialog.svelte';
  import LibraryEntry from '../LibraryEntry.svelte';
  import type { Item } from '$lib/types';
  import { snapshotState } from '$lib/util/snapshot.svelte';
  import SidebarSection from '../SidebarSection.svelte';
  import { addItem, getPlaymat } from '../playmat';
  import type { PageData } from './$types';
  import { getRelics } from './relics';
  interface Props {
    data: PageData;
  }

  let { data }: Props = $props();

  let reliquary = getRelics();
  let mat = getPlaymat();
  let itemDialog: EquipmentDialog | undefined = $state();

  function addToMat(item: Item) {
    const cloned = structuredClone(snapshotState(item));
    if (cloned.quantFormula) {
      cloned.quantity = rollFormula(cloned.quantFormula);
    }
    addItem(mat, cloned);
  }
</script>

<svelte:head>
  <title>Relics :: Brighter Worlds Online</title>
</svelte:head>
<div class="flex flex-col gap-4">
  <EquipmentDialog
    bind:this={itemDialog}
    bind:equipment={reliquary.items}
    allowFormula
    allowDelete={false}
  />
  <SidebarSection title="Custom Items" open addable onclick={() => itemDialog?.addGear()}>
    {#each reliquary.items as item (item.id)}
      <LibraryEntry
        name={item.name}
        kind="item"
        onedit={() => itemDialog?.editGear(item.id)}
        onadd={() => addToMat(item)}
        ondelete={() => reliquary.removeItem(item)}
      />
    {/each}
  </SidebarSection>
  <SidebarSection title="SRD Items">
    {#each data.relics as relic (relic.id)}
      <div class="flex flex-row justify-between">
        <button type="button" class="cursor-pointer" onclick={() => addToMat(relic)}
          >{relic.name}</button
        >
      </div>
    {/each}
  </SidebarSection>
</div>
