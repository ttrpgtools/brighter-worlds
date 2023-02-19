<script lang="ts">
  import Button from "$lib/Button.svelte";
  import RollableTable from "$lib/RollableTable.svelte";
  import type { Item, StartingGearOptions, DieValue, TableRoll } from "$lib/types";
  import { createEventDispatcher } from "svelte";

  export let gear: StartingGearOptions;
  export let die: DieValue;
  export let index: number;

  const dispatch = createEventDispatcher<{roll: {pair: Pair; index: number}}>();
  let flair = '';
  let item: Item;
  let flairRoll = 0;
  let itemRoll = 0;
  let both = false;
  let flairTable: RollableTable<string>;
  let itemTable: RollableTable<Item>;

  type Pair = [string | undefined, Item | undefined];
  let pair: Pair = [undefined, undefined];

  $: {
    pair = [flair, item];
    both = !!flair && item != null;
    if (both) {
      dispatch('roll', {pair, index});
    }
  }

  function swap() {
    const x = itemRoll;
    itemTable.rollTable(flairRoll);
    flairTable.rollTable(x);
  }

  function handleFlair(ev: CustomEvent<TableRoll<string>>) {
    flair = ev.detail.value;
    flairRoll = ev.detail.roll;
  }

  function handleItem(ev: CustomEvent<TableRoll<Item>>) {
    item = ev.detail.value;
    itemRoll = ev.detail.roll;
  }
</script>
<div class="flex flex-col gap-2 mb-4">
  <div class="flex gap-4 items-center justify-center">
    <span class="text-2xl">{gear.name}</span>
    <Button on:click={swap} disabled={!both}>Swap</Button>
  </div>
  <div class="flex justify-center gap-4 mb-6">
    <div class="w-96">
      <RollableTable options={gear.flair} title="Flair" once {die} on:roll={handleFlair} bind:this={flairTable} />
    </div>
    <div class="w-96">
      <RollableTable options={gear.items} title="Item" once labelSelect={x => x.name} {die} on:roll={handleItem} bind:this={itemTable} />
    </div>
  </div>
</div>