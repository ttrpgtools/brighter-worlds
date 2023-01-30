<script lang="ts">
import type { Attribute, DieValue } from "$lib/types";
import { createEventDispatcher } from "svelte";
import DieSelector from "./DieSelector.svelte";
export let name: string;
export let value: Attribute<DieValue> = { current: 4, max: 4 };
export let num: Attribute<number> = { current: 0, max: 0 };
export let numerical = false;
const dispatch = createEventDispatcher();

function rollSave(ev: MouseEvent) {
  const dice = [ev.altKey ? 4 : value.current];
  if (!ev.altKey && ev.metaKey) {
    dice.push(12);
  }
  dispatch('roll', { dice });
}
</script>
<div class="grid grid-cols-5 items-center">
  <div class="font-subtitle text-2xl">{name}</div>
  <div class="col-span-3 flex gap-1 items-center">
    <div class="relative">
      {#if numerical}
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" class="w-12"><path fill="currentColor" d="M384 32C419.3 32 448 60.65 448 96V416C448 451.3 419.3 480 384 480H64C28.65 480 0 451.3 0 416V96C0 60.65 28.65 32 64 32H384zM384 64H64C46.33 64 32 78.33 32 96V416C32 433.7 46.33 448 64 448H384C401.7 448 416 433.7 416 416V96C416 78.33 401.7 64 384 64z"/></svg>
      <span class="absolute text-2xl w-12 text-center top-1/2 -translate-y-1/2 leading-none">{num.current}</span>
      {:else}
      <DieSelector bind:current={value.current} />
      {/if}
    </div>
    <span class="text-2xl text-center">/</span>
    {#if numerical}
    <span class="text-xl w-6 text-center">{num.max}</span>
    {:else}
    <DieSelector bind:current={value.max} />
    {/if}
  </div>
  <div class="flex-1 text-right">
    <button type="button" on:click={rollSave} class="inline-flex items-center rounded-full border border-transparent bg-purple-300 dark:bg-purple-700 px-2 py-0.25 text-xs font-medium shadow-sm hover:bg-purple-200 dark:hover:bg-purple-800 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" class="w-6"><path fill="currentColor" d="M352 256C352 238.3 366.3 224 384 224C401.7 224 416 238.3 416 256C416 273.7 401.7 288 384 288C366.3 288 352 273.7 352 256zM192 256C192 238.3 206.3 224 224 224C241.7 224 256 238.3 256 256C256 273.7 241.7 288 224 288C206.3 288 192 273.7 192 256zM96 256C96 273.7 81.67 288 64 288C46.33 288 32 273.7 32 256C32 238.3 46.33 224 64 224C81.67 224 96 238.3 96 256z"/></svg></button>
  </div>
</div>