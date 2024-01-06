<script lang="ts">
  import { rollFormula } from "$lib/rolling/roll";
  import Equipment from "$lib/sheet/Equipment.svelte";
  import type { Item } from "$lib/types";
  import SidebarSection from "../SidebarSection.svelte";
  import { addItem, getPlaymat } from "../playmat";
  import type { PageData } from "./$types";
  import { getRelics } from "./relics";
  export let data: PageData;

  let reliquary = getRelics();
  let mat = getPlaymat();

  function addToMat(item: Item) {
    const cloned = structuredClone(item);
    if (cloned.quantFormula) {
      cloned.quantity = rollFormula(cloned.quantFormula);
    }
    addItem(mat, cloned);
  }

  function add(ev: CustomEvent<Item>) {
    const item = ev.detail;
    addToMat(item);
  }
</script>
<svelte:head>
  <title>Relics :: Brighter Worlds Online</title>
</svelte:head>
<div class="flex flex-col gap-4">
  <SidebarSection title="Custom Items" open>
    <Equipment bind:equipment={$reliquary} title="Relics" hideArmor selectable on:select-item={add} allowFormula></Equipment>
  </SidebarSection>
  <SidebarSection title="SRD Items">
    {#each data.relics as relic}
    <div class="flex flex-row justify-between">
      <button type="button" class="cursor-pointer" on:click={() => addToMat(relic)}>{relic.name}</button>
    </div>
    {/each}
  </SidebarSection>
</div>