<script lang="ts">
  import Button from '$lib/ui/button.svelte';
  import Die from '$lib/dice/Die.svelte';
  import RollableTable from '$lib/RollableTable.svelte';
  import type { Item, StartingGearOptions, DieValue, TableRoll } from '$lib/types';

  interface Props {
    gear: StartingGearOptions;
    die: DieValue;
    index: number;
    type: string;
    onroll: (roll: { pair: Pair; index: number }) => void;
  }

  let { gear, die, index, type, onroll }: Props = $props();

  let flair: string | Item = $state('');
  let item: Item | undefined = $state();
  let flairRoll = 0;
  let itemRoll = 0;
  let both = $state(false);
  let flairTable: RollableTable<string | Item> | undefined = $state();
  let itemTable: RollableTable<Item> | undefined = $state();

  type Pair = [string | Item | undefined, Item | undefined];
  let pair: Pair = $state([undefined, undefined]);

  function swap() {
    const x = itemRoll;
    itemTable?.rollTable(flairRoll);
    flairTable?.rollTable(x);
  }

  function roll() {
    flairTable?.rollTable();
    itemTable?.rollTable();
  }

  function act() {
    if (both) {
      swap();
    } else {
      roll();
    }
  }

  function report() {
    pair = [flair, item];
    both = !!flair && item != null;
    if (both) {
      onroll({ pair, index });
    }
  }

  function handleFlair(roll: TableRoll<string | Item>) {
    flair = roll.value[0];
    flairRoll = roll.roll;
    report();
  }

  function handleItem(tr: TableRoll<Item>) {
    item = tr.value[0];
    itemRoll = tr.roll;
    report();
  }
</script>

<div class="flex flex-col gap-2 mb-4 w-full">
  <div class="flex gap-4 items-center justify-center">
    <span class="text-2xl">{gear.name} / {type.toUpperCase()}</span>
    <Button onclick={act}>{both ? `Swap` : `Roll`}</Button>
  </div>
  <div class="flex justify-center gap-4 mb-6 flex-wrap">
    <div class="w-full max-w-sm">
      <RollableTable
        options={gear.flair}
        title="Flair"
        once
        {die}
        onroll={handleFlair}
        bind:this={flairTable}
        >{#snippet children({ opt })}
          {#if typeof opt === 'string'}{opt}{:else}{opt.name}
            {#if opt.damage}<span class="ml-1 inline-block relative -top-px"
                >(<Die which={opt.damage} size="h-4 w-4" /> d{opt.damage})</span
              >{/if}{/if}
        {/snippet}
      </RollableTable>
    </div>
    <div class="w-full max-w-sm">
      <RollableTable
        options={gear.items}
        title="Item"
        once
        {die}
        onroll={handleItem}
        bind:this={itemTable}
        >{#snippet children({ opt })}
          {opt.name}
          {#if opt.damage}<span class="ml-1 inline-block relative -top-px"
              >(<Die which={opt.damage} size="h-4 w-4" /> d{opt.damage})</span
            >{/if}
        {/snippet}
      </RollableTable>
    </div>
  </div>
</div>
