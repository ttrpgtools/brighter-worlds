<script lang="ts">
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
    addItem(mat, cloned);
  }

  function add(ev: CustomEvent<Item>) {
    const item = ev.detail;
    addToMat(item);
  }
</script>
<div class="flex flex-col gap-4">
  <SidebarSection title="Custom Items" open addable>
    <Equipment bind:equipment={$reliquary} title="Relics" hideArmor selectable on:select-item={add}></Equipment>
  </SidebarSection>
  <SidebarSection title="SRD Items">
    {#each data.relics as relic}
    <div class="flex flex-row justify-between">
      <button type="button" class="cursor-pointer" on:click={() => addToMat(relic)}>{relic.name}</button>
    </div>
    {/each}
  </SidebarSection>
</div>