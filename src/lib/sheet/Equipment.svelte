<script lang="ts">
import { Die } from "$lib/dice";
  import { getModifiedDice } from "$lib/rolling/modifier";
import type { DieValue, Item } from "$lib/types";
import { armor } from "$lib/util/character";
import { onEnter } from "$lib/util/handlers";
import { createEventDispatcher } from "svelte";
import Card from "../Card.svelte";
import EquipmentDialog from "./EquipmentDialog.svelte";
export let equipment: Item[] = [];
$: totalArmor = armor(equipment);

let dialog: EquipmentDialog;

const dispatch = createEventDispatcher();
function rollDamage(ev: MouseEvent, item: Item) {
  if (item.damage == null) return;
  const dice = getModifiedDice(ev, item.damage as DieValue);
  dispatch('roll', { dice, name: item.name });
}

function addGear() {
  dialog.addGear();
}

function editGear(id: string) {
  dialog.editGear(id);
}
</script>
<Card class="md:h-[25rem]">
  <EquipmentDialog bind:equipment bind:this={dialog} />
  <svelte:fragment slot="header">
    <div class="">
      <h3 class="text-xl font-subtitle leading-6">Equipment</h3>
    </div>
    <div class="flex-shrink-0">
      <div class="flex gap-4 items-center">
        <div class="relative">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" class="w-6"><path fill="currentColor" d="M256 0c4.6 0 9.2 1 13.4 2.9L457.7 82.8c22 9.3 38.4 31 38.3 57.2c-.5 99.2-41.3 280.7-213.7 363.2c-16.7 8-36.1 8-52.8 0C57.3 420.7 16.5 239.2 16 140c-.1-26.2 16.3-47.9 38.3-57.2L242.7 2.9C246.8 1 251.4 0 256 0z"/></svg>
          <div class="absolute w-full text-center text-lg top-1/2 -translate-y-1/2 leading-none text-white dark:text-gray-900">{totalArmor}</div>
        </div>
        <button type="button" on:click={addGear} class="relative inline-flex items-center rounded-full bg-purple-300 dark:bg-purple-700 p-1 font-medium shadow-sm hover:bg-purple-200 dark:hover:bg-purple-800 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-900"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" class="h-4 w-4"><path fill="currentColor" d="M256 80c0-17.7-14.3-32-32-32s-32 14.3-32 32V224H48c-17.7 0-32 14.3-32 32s14.3 32 32 32H192V432c0 17.7 14.3 32 32 32s32-14.3 32-32V288H400c17.7 0 32-14.3 32-32s-14.3-32-32-32H256V80z"/></svg></button>
      </div>
    </div>
  </svelte:fragment>
  <!-- body -->
  <div>
    <div class="flow-root">
      <ul class="-my-5 divide-y divide-gray-200 dark:divide-gray-600">
        {#each equipment as item (item.id)}
        <li class="py-3">
          <div class="flex items-center space-x-4">
            <div class="min-w-0 flex-1 flex gap-4">
              <p class="truncate text-sm font-medium cursor-pointer" title={item.name} on:click={() => editGear(item.id)} on:keydown={onEnter(() => editGear(item.id))}>{item.name}</p>
            </div>
            <div class="flex gap-2 items-center">
              {#if item.bulky}<span class="inline-flex items-center rounded-full dark:bg-purple-100 px-2.5 py-0.5 text-xs font-medium dark:text-purple-800 bg-purple-800 text-purple-100">Bulky</span>{/if}
              {#if item.damage}<button on:click={(ev) => rollDamage(ev, item)} class="inline-flex items-center text-sm font-medium leading-5"><Die which={item.damage}/></button>{/if}
            </div>
          </div>
          {#if item.desc}<p class="text-sm text-gray-600 dark:text-gray-400 truncate" title={item.desc}>{item.desc}</p>{/if}
        </li>
        {/each}
      </ul>
    </div>
  </div>

</Card>