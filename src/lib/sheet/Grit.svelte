<script lang="ts">
  import type { Attribute } from "$lib/types";
  import { createEventDispatcher } from "svelte";
  export let value: Attribute<number> = { current: 0, max: 0 };
  const dispatch = createEventDispatcher();
  function rest() {
    dispatch('rest');
  }
</script>
<div class="grid grid-cols-5 items-center">
  <div class="font-subtitle text-2xl">Grit</div>
  <div class="col-span-3 flex gap-1 items-center">
    <div class="relative">
      <input type="number" min="0" max="12" class="block w-20 accent-purple-500 text-lg py-2 px-3 rounded-md border-gray-300 bg-white dark:bg-gray-900 dark:hover:bg-gray-800 dark:border-gray-600 shadow-sm focus:border-purple-500 focus:ring-purple-500" bind:value={value.current}>
    </div>
    <span class="text-2xl text-center">/</span>
    <input type="number" min="0" max="12" class="block w-20 text-lg py-2 px-3 rounded-md border-gray-300 bg-white dark:bg-gray-900 dark:hover:bg-gray-800 dark:border-gray-600 shadow-sm focus:border-purple-500 focus:ring-purple-500" bind:value={value.max}>
  </div>
  <div class="flex-1 text-right">
    <button type="button" on:click={rest} class="inline-flex items-center rounded-full border border-transparent bg-purple-300 dark:bg-purple-700 px-4 py-2 text-xs font-medium shadow-sm hover:bg-purple-200 dark:hover:bg-purple-800 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-900">Rest</button>
  </div>
</div>