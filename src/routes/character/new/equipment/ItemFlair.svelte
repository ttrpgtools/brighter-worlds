<script lang="ts">
  import Button from "$lib/Button.svelte";
  import Die from "$lib/dice/Die.svelte";
  import RollableTable from "$lib/RollableTable.svelte";
  import type { Item, StartingGearOptions, DieValue, TableRoll } from "$lib/types";
  import { createEventDispatcher } from "svelte";

  export let gear: StartingGearOptions;
  export let die: DieValue;
  export let index: number;
  export let type: string;

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

  function roll() {
    flairTable.rollTable();
    itemTable.rollTable();
  }

  function act() {
    if (both) {
      swap();
    } else {
      roll();
    }
  }

  function handleFlair(ev: CustomEvent<TableRoll<string>>) {
    flair = ev.detail.value[0];
    flairRoll = ev.detail.roll;
  }

  function handleItem(ev: CustomEvent<TableRoll<Item>>) {
    item = ev.detail.value[0];
    itemRoll = ev.detail.roll;
  }
</script>
<div class="flex flex-col gap-2 mb-4 w-full">
  <div class="flex gap-4 items-center justify-center">
    <span class="text-2xl">{gear.name} / {type.toUpperCase()}</span>
    <Button on:click={act}>{both ? `Swap` : `Roll`}</Button>
  </div>
  <div class="flex justify-center gap-4 mb-6 flex-wrap">
    <div class="w-full max-w-sm">
      <RollableTable options={gear.flair} title="Flair" once {die} on:roll={handleFlair} bind:this={flairTable} />
    </div>
    <div class="w-full max-w-sm">
      <RollableTable options={gear.items} title="Item" once {die} on:roll={handleItem} bind:this={itemTable} let:opt>{opt.name} {#if opt.damage}<span class="ml-1 inline-block relative -top-px">(<Die which={opt.damage} size="h-4 w-4" /> d{opt.damage})</span>{/if}</RollableTable>
    </div>
  </div>
</div>