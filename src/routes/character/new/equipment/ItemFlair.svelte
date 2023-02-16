<script lang="ts">
  import Button from "$lib/Button.svelte";
  import RollableTable from "$lib/RollableTable.svelte";
  import type { Item, StartingGearOptions, DieValue } from "$lib/types";

  export let gear: StartingGearOptions;
  export let die: DieValue;
  export let pair: [string | undefined, Item | undefined] = [undefined, undefined];

  let flair = '';
  let item: Item;
  let flairRoll = 0;
  let itemRoll = 0;
  let both = false;

  $: {
    pair = [flair, item];
    both = !!flair && item != null;
  }

  function swap() {
    const x = flairRoll;
    flairRoll = itemRoll;
    itemRoll = x;
  }
</script>
<div class="flex flex-col gap-2 mb-4">
  <div class="flex gap-4 items-center justify-center">
    <span class="text-2xl">{gear.name}</span>
    <Button on:click={swap} disabled={!both}>Swap</Button>
  </div>
  <div class="flex justify-center gap-4 mb-6">
    <div class="w-96">
      <RollableTable options={gear.flair} title="Flair" bind:selected={flair} once bind:rolled={flairRoll} {die} />
    </div>
    <div class="w-96">
      <RollableTable options={gear.items} title="Item" bind:selected={item} once bind:rolled={itemRoll} labelSelect={x => x.name} {die} />
    </div>
  </div>
</div>