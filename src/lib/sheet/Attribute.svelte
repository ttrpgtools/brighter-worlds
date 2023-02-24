<script lang="ts">
  import { getEnhanced, getImpaired, getModifiedDice } from "$lib/rolling/modifier";
import type { Attribute, DieValue } from "$lib/types";
import { createEventDispatcher } from "svelte";
import DieSelector from "./DieSelector.svelte";
export let name: string;
export let value: Attribute<DieValue, 0> = { current: 4, max: 4 };
const dispatch = createEventDispatcher();

function rollSave(ev: MouseEvent) {
  if (value.current <= 0) return;
  const dice = getModifiedDice(ev, value.current as DieValue);
  dispatch('roll', { dice });
}

function cc(ev: Event) {
  if (ev.type === 'contextmenu') {
    ev.preventDefault();
    modMenu = true;
  }
}
function rollEnhance() {
  if (value.current <= 0) return;
  const dice = getEnhanced(value.current as DieValue);
  modMenu = false;
  dispatch('roll', { dice });
}
function rollImpair() {
  if (value.current <= 0) return;
  const dice = getImpaired();
  modMenu = false;
  dispatch('roll', { dice });
}
let modMenu = false;
function takeDamage() {
  dispatch('damage', {type: name.toLowerCase()});
}
</script>
<div class="grid grid-cols-5 items-center">
  <div class="relative">
    {#if modMenu}
    <div class="absolute z-10 -right-8 flex flex-col gap-2 top-1/2 -translate-y-1/2">
      <button type="button" on:click={rollEnhance} class="bg-emerald-500 text-white rounded-full p-2 flex items-center justify-center"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" class="h-8 w-8"><path fill="currentColor" d="M240 80c0-17.7-14.3-32-32-32s-32 14.3-32 32V224H32c-17.7 0-32 14.3-32 32s14.3 32 32 32H176V432c0 17.7 14.3 32 32 32s32-14.3 32-32V288H384c17.7 0 32-14.3 32-32s-14.3-32-32-32H240V80z"/></svg></button>
      <button type="button" on:click={rollImpair} class="bg-rose-500 text-white rounded-full p-2 flex items-center justify-center"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" class="h-8 w-8"><path fill="currentColor" d="M416 256c0 17.7-14.3 32-32 32L32 288c-17.7 0-32-14.3-32-32s14.3-32 32-32l352 0c17.7 0 32 14.3 32 32z"/></svg></button>
    </div>
    {/if}
    <button type="button" on:click={rollSave} on:contextmenu={cc} title="Roll {name} Save" class="font-subtitle text-xl bg-purple-300 dark:bg-purple-700 hover:bg-purple-200 dark:hover:bg-purple-800 rounded-full px-2 pt-2 pb-1 w-16 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-900">{name}</button>
  </div>
  <div class="col-span-3 flex gap-1 items-center">
    <div class="relative">
      <DieSelector bind:current={value.current} nullable invalid={value.current > value.max} on:change/>
    </div>
    <span class="text-2xl text-center">/</span>
    <DieSelector bind:current={value.max} on:change/>
  </div>
  <div class="flex-1 text-right">
    <button type="button" on:click={takeDamage} class="inline-flex items-center rounded-full border border-transparent bg-purple-300 dark:bg-purple-700 px-4 py-2 text-xs font-medium shadow-sm hover:bg-purple-200 dark:hover:bg-purple-800 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-900" title="Take {name} Damage"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 512" class="w-7"><path fill="currentColor" d="M256 32c0-17.7-14.3-32-32-32s-32 14.3-32 32l0 9.8c0 39-23.7 74-59.9 88.4C71.6 154.5 32 213 32 278.2V352c0 17.7 14.3 32 32 32s32-14.3 32-32l0-73.8c0-10 1.6-19.8 4.5-29L261.1 497.4c9.6 14.8 29.4 19.1 44.3 9.5s19.1-29.4 9.5-44.3L222.6 320H224l80 0 38.4 51.2c10.6 14.1 30.7 17 44.8 6.4s17-30.7 6.4-44.8l-43.2-57.6C341.3 263.1 327.1 256 312 256l-71.5 0-56.8-80.2-.2-.3c44.7-29 72.5-79 72.5-133.6l0-9.8zM96 80c0-26.5-21.5-48-48-48S0 53.5 0 80s21.5 48 48 48s48-21.5 48-48zM464 286.1l58.6 53.9c4.8 4.4 11.9 5.5 17.8 2.6s9.5-9 9-15.5l-5.6-79.4 78.7-12.2c6.5-1 11.7-5.9 13.1-12.2s-1.1-13-6.5-16.7l-65.6-45.1L603 92.2c3.3-5.7 2.7-12.8-1.4-17.9s-10.9-7.2-17.2-5.3L508.3 92.1l-29.4-74C476.4 12 470.6 8 464 8s-12.4 4-14.9 10.1l-29.4 74L343.6 68.9c-6.3-1.9-13.1 .2-17.2 5.3s-4.6 12.2-1.4 17.9l39.5 69.1-65.6 45.1c-5.4 3.7-8 10.3-6.5 16.7c.1 .3 .1 .6 .2 .8l19.4 0c20.1 0 39.2 7.5 53.8 20.8l18.4 2.9L383 265.3l36.2 48.3c2.1 2.8 3.9 5.7 5.5 8.6L464 286.1z"/></svg></button>
  </div>
</div>