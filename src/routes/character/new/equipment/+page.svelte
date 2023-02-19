<script lang="ts">
  import type { Item, EquipmentChoice, CharacterChoice } from "$lib/types";
  import { STEP, wizard, builder } from "../wizard";
  import { goto } from "$app/navigation";
  import { browser } from "$app/environment";
  import Button from "$lib/Button.svelte";
  import { gearManager } from '$lib/data/gear-manager';
  import ItemFlair from "./ItemFlair.svelte";
  import { filterEmpty } from "$lib/util/array";

  if ($wizard !== STEP.EQUIPMENT && browser) {
    goto(`/character/new`);
  }

  
  function forward() {
    const startingGear = filterEmpty(allPairs.map(combine));
    wizard.setEquipment(startingGear);
  }

  const gearTables = gearManager.list;

  if (browser) {
    gearManager.loadList();
  }

  type Pair = [string | undefined, Item | undefined];
  let allPairs: Pair[] = [];
  let extras: EquipmentChoice[];

  const onlyEquipment = (choice: CharacterChoice): choice is EquipmentChoice => choice.choose === 'equipment';

  $: {
    extras = ($builder.choices ?? []).filter(onlyEquipment);
    allPairs = Array.from(Array(3 + extras.length), () => ([undefined, undefined] as Pair));
  }

  function setPair(ev: CustomEvent<{pair: Pair; index: number}>) {
    const {pair, index} = ev.detail;
    if (allPairs[index]) {
      allPairs[index][0] = pair[0];
      allPairs[index][1] = pair[1];
    }
  }

  function combine(pair: Pair) {
    if (!pair[0] || pair[1] == null) return;
    const item = {...pair[1], name: `${pair[0]} ${pair[1].name}`} as Item;
    return item;
  }
</script>
<h3 class="max-w-prose text-center mb-4 text-lg">Choose your starting equipment</h3>
<ItemFlair gear={$gearTables.str} die={$builder.str?.max ?? 4} on:roll={setPair} index={0} />
<ItemFlair gear={$gearTables.dex} die={$builder.dex?.max ?? 4} on:roll={setPair} index={1} />
<ItemFlair gear={$gearTables.wil} die={$builder.wil?.max ?? 4} on:roll={setPair} index={2} />
{#if extras.length}
<div class="text-lg mb-4">Extra Equipment from the {$builder.calling?.name} Calling</div>
{#each extras as table, ti}
<ItemFlair gear={$gearTables[table.type]} die={table.die} on:roll={setPair} index={ti + 3} />
{/each}
{/if}
<Button on:click={forward}>Next</Button>
