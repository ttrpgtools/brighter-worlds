<script lang="ts">
  import type { TableRoll, Item } from "$lib/types";
  import { STEP, wizard, builder } from "../wizard";
  import { goto } from "$app/navigation";
  import { browser } from "$app/environment";
  import Button from "$lib/Button.svelte";
  import { gearManager } from '$lib/data/gear-manager';
  import ItemFlair from "./ItemFlair.svelte";

  if ($wizard !== STEP.EQUIPMENT && browser) {
    goto(`/character/new`);
  }

  function forward() {
    combine(strPair);
    combine(dexPair);
    combine(wilPair);
    wizard.setEquipment(startingGear);
  }

  const gearTables = gearManager.list;

  if (browser) {
    gearManager.loadList();
  }

  type Pair = [string | undefined, Item | undefined];
  let startingGear: Item[] = [];
  let strPair: Pair = [undefined, undefined];
  let dexPair: Pair = [undefined, undefined];
  let wilPair: Pair = [undefined, undefined];

  function combine(pair: Pair) {
    if (!pair[0] || pair[1] == null) return;
    const item = {...pair[1], name: `${pair[0]} ${pair[1].name}`};
    startingGear.push(item);
  }
</script>

<ItemFlair gear={$gearTables.str} die={$builder.str?.max ?? 4} bind:pair={strPair} />
<ItemFlair gear={$gearTables.dex} die={$builder.dex?.max ?? 4} bind:pair={dexPair} />
<ItemFlair gear={$gearTables.wil} die={$builder.wil?.max ?? 4} bind:pair={wilPair} />
<Button on:click={forward}>Next</Button>
