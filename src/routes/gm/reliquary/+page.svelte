<script lang="ts">
  import { rollFormula } from '$lib/rolling/roll';
  import Equipment from '$lib/sheet/Equipment.svelte';
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
  <SidebarSection title="Custom Items" open>
    <Equipment
      bind:equipment={reliquary.items}
      title="Relics"
      hideArmor
      selectable
      onselect={addToMat}
      allowFormula
      onroll={() => {}}
      onshare={() => {}}
    ></Equipment>
  </SidebarSection>
  <SidebarSection title="SRD Items">
    {#each data.relics as relic}
      <div class="flex flex-row justify-between">
        <button type="button" class="cursor-pointer" onclick={() => addToMat(relic)}
          >{relic.name}</button
        >
      </div>
    {/each}
  </SidebarSection>
</div>
