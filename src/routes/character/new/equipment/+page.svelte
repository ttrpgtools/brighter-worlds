<script lang="ts">
  import type { EquipmentChoice } from '$lib/types';
  import { STEP, getWizard, guardWizardStep } from '../wizard.svelte';
  import { browser } from '$app/environment';
  import Button from '$lib/ui/button.svelte';
  import { gearManager } from '$lib/data/gear-manager';
  import ItemFlair from './ItemFlair.svelte';
  import type { StartingGearPair } from '$lib/data/starting-equipment';
  import { onlyEquipment } from '$lib/util/guards';

  const [wizard, builder] = getWizard();

  guardWizardStep(wizard, STEP.EQUIPMENT);

  const gearTables = gearManager.list;
  function forward() {
    wizard.send('setEquipment', $state.snapshot(allPairs));
  }

  if (browser) {
    gearManager.loadList();
  }

  type Pair = StartingGearPair;
  let allPairs: Pair[] = $state([]);
  let extras: EquipmentChoice[] = $derived((builder.sheet.choices ?? []).filter(onlyEquipment));
  let valid = $derived(
    Array.from({ length: 3 + extras.length }, (_, index) => allPairs[index]).every(
      (pair) => pair?.[0] && pair[1],
    ),
  );

  function setPair({ pair, index }: { pair: Pair; index: number }) {
    allPairs[index] = pair;
  }
</script>

<h3 class="max-w-prose text-center mb-4 text-2xl font-subtitle">Choose your starting equipment</h3>

<p class="max-w-prose text-left mb-4">
  Most Callings start with equipment, weapons, or other useful items. Those have already been added. {#if extras.length}Your
    Calling includes extra equipment that needs to be rolled down below.{/if}
</p>

<p class="max-w-prose text-left mb-4">
  You can then roll for Starting Equipment on the lists below to see what else you're carrying. You
  perform the roll by clicking on the purple "Roll" button for each list.
</p>

<p class="max-w-prose text-left mb-6">
  After rolling, you can opt to Swap the values for the Flair and the Item if that is more
  interesting. For example if you roll your d6 STR and get a 2 and 6 you can either have a Heirloom
  Flail or a Silent Bow. Multi-Function tools combine two freshly rolled tools when you continue.
</p>
{#if builder.sheet.abilities?.some((a) => a.name === 'Poverty' && a.details === 'vow')}
  <p class="max-w-prose mb-4">Your Vow of Poverty means you start without the usual 50 coins.</p>
{/if}

<ItemFlair
  gear={$gearTables.str}
  die={builder.sheet.str?.max ?? 4}
  onroll={setPair}
  index={0}
  type="str"
/>
<ItemFlair
  gear={$gearTables.dex}
  die={builder.sheet.dex?.max ?? 4}
  onroll={setPair}
  index={1}
  type="dex"
/>
<ItemFlair
  gear={$gearTables.wil}
  die={builder.sheet.wil?.max ?? 4}
  onroll={setPair}
  index={2}
  type="wil"
/>
{#if extras.length}
  <div class="text-lg mb-4">Extra Equipment from the {builder.sheet.calling?.name} Calling</div>
  {#each extras as table, ti (ti)}
    <ItemFlair
      gear={$gearTables[table.type]}
      die={table.die}
      onroll={setPair}
      index={ti + 3}
      type={table.type}
    />
  {/each}
{/if}
<Button disabled={!valid} onclick={forward}>Next</Button>
