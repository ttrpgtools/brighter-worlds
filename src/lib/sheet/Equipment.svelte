<script lang="ts">
import { Die } from "$lib/dice";
import type { DieValue, Item } from "$lib/types";
import { createEventDispatcher } from "svelte";
import Card from "./Card.svelte";
export let equipment: Item[];
$: totalArmor = equipment.reduce((p, c) => p + (!!c.armor ? c.armor : 0), 0);

const dispatch = createEventDispatcher();
function rollDamage(ev: MouseEvent, item: Item) {
  if (item.damage == null) return;
  const dice = [ev.altKey ? 4 : item.damage];
  if (!ev.altKey && ev.metaKey) {
    dice.push(12);
  }
  dispatch('roll', { dice, name: item.name });
}

function addGear() {
  dispatch('add');
}
</script>
<Card>
  <svelte:fragment slot="header">
    <div class="ml-4 mt-4">
      <h3 class="text-xl font-subtitle leading-6">Equipment</h3>
      <p class="mt-1 text-sm text-gray-500">More than two bulky items sets your Grit to 0.</p>
    </div>
    <div class="ml-4 mt-4 flex-shrink-0">
      <div class="flex gap-4 items-center">
        <div class="relative">
          <div class="absolute w-full text-center text-2xl top-1/2 -translate-y-1/2 leading-none">{totalArmor}</div>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" class="w-12"><path fill="currentColor" d="M231 7.838C247 1.065 265.1 1.066 281 7.84L457.7 82.79C479.7 92.12 496.2 113.8 496 139.1C495.5 239.2 454.7 420.7 282.4 503.2C265.7 511.1 246.3 511.1 229.6 503.2C57.26 420.7 16.49 239.2 16 139.1C15.87 113.8 32.32 92.12 54.3 82.79L231 7.838zM268.5 37.3C260.5 33.91 251.5 33.91 243.5 37.3L66.79 112.3C55.51 117 47.94 127.7 48 139.8C48.46 233.8 87.33 399.6 243.4 474.3C251.4 478.1 260.6 478.1 268.6 474.3C424.7 399.6 463.6 233.8 464 139.8C464.1 127.7 456.5 117 445.2 112.3L268.5 37.3z"/></svg>
        </div>
        <div><button type="button" on:click={addGear} class="relative inline-flex items-center rounded-full border border-transparent bg-purple-300 dark:bg-purple-700 px-2 py-2 text-sm font-medium shadow-sm hover:bg-purple-200 dark:hover:bg-purple-800 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" class="w-6"><path fill="currentColor" d="M272 240H496C504.8 240 512 247.2 512 256C512 264.8 504.8 272 496 272H272V496C272 504.8 264.8 512 255.1 512C247.2 512 239.1 504.8 239.1 496V272H16C7.164 272 0 264.8 0 256C0 247.2 7.164 240 16 240H239.1V16C239.1 7.164 247.2 0 255.1 0C264.8 0 272 7.164 272 16V240z"/></svg></button></div>
      </div>
    </div>
  </svelte:fragment>
  <!-- body -->
  <div>
    <div class="flow-root">
      <ul class="-my-5 divide-y divide-gray-200 dark:divide-gray-600">
        {#each equipment as item}
        <li class="py-3">
          <div class="flex items-center space-x-4">
            <div class="min-w-0 flex-1 flex gap-4">
              <p class="truncate text-sm font-medium" title={item.name}>{item.name}</p>
              {#if item.desc}<p class="text-sm truncate text-gray-500" title={item.desc}>{item.desc}</p>{/if}
            </div>
            <div class="flex gap-2 items-center">
              {#if item.bulky}<span class="inline-flex items-center rounded-full dark:bg-purple-100 px-2.5 py-0.5 text-xs font-medium dark:text-purple-800 bg-purple-800 text-purple-100">Bulky</span>{/if}
              {#if item.damage}<button on:click={(ev) => rollDamage(ev, item)} class="inline-flex items-center text-sm font-medium leading-5"><Die which={item.damage}/></button>{/if}
            </div>
          </div>
        </li>
        {/each}
      </ul>
    </div>
  </div>

</Card>