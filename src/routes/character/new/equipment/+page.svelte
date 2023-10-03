<script lang="ts">
  import type { Item, EquipmentChoice } from "$lib/types";
  import { STEP, getWizard } from "../wizard";
  import { goto } from "$app/navigation";
  import { browser } from "$app/environment";
  import Button from "$lib/Button.svelte";
  import { gearManager } from '$lib/data/gear-manager';
  import ItemFlair from "./ItemFlair.svelte";
  import { filterEmpty } from "$lib/util/array";
  import { onlyEquipment } from "$lib/util/guards";

  const [wizard, builder] = getWizard();

  if ($wizard !== STEP.EQUIPMENT && browser) {
    goto(`/character/new`);
  }
  
  const gearTables = gearManager.list;
  function forward() {
    const rolledGear = filterEmpty(allPairs.map(combine));
    wizard.setEquipment([...$gearTables.starting, ...rolledGear]);
  }


  if (browser) {
    gearManager.loadList();
  }

  type Pair = [string | undefined, Item | undefined];
  let allPairs: Pair[] = [];
  let extras: EquipmentChoice[];

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
<h3 class="max-w-prose text-center mb-4 text-2xl font-subtitle">Choose your starting equipment</h3>

<p class="max-w-prose text-left mb-4">Most Callings start with equipment, weapons, or other useful items. Those have already been added. {#if extras.length}Your Calling includes extra equipment that needs to be rolled down below.{/if}</p>

<p class="max-w-prose text-left mb-4">You can then roll for Starting Equipment on the lists below to see what else you're carrying. You perform the roll by clicking on the purple "Roll" button for each list.</p>

<p class="max-w-prose text-left mb-6">After rolling, you can opt to Swap the values for the Flair and the Item if that is more interesting. For example if you roll your d6 STR and get a 2 and 6 you can either have a Rugged Flail or a Blackened Bow.</p>

<ItemFlair gear={$gearTables.str} die={$builder.str?.max ?? 4} on:roll={setPair} index={0} type="str" />
<ItemFlair gear={$gearTables.dex} die={$builder.dex?.max ?? 4} on:roll={setPair} index={1} type="dex" />
<ItemFlair gear={$gearTables.wil} die={$builder.wil?.max ?? 4} on:roll={setPair} index={2} type="wil" />
{#if extras.length}
<div class="text-lg mb-4">Extra Equipment from the {$builder.calling?.name} Calling</div>
{#each extras as table, ti}
<ItemFlair gear={$gearTables[table.type]} die={table.die} on:roll={setPair} index={ti + 3} type={table.type}/>
{/each}
{/if}
<Button on:click={forward}>Next</Button>
