<script lang="ts">
import { Die } from "$lib/dice";
import type { DieValue } from "$lib/types";
import { scale } from 'svelte/transition';
import { Listbox, ListboxButton, ListboxOptions, ListboxOption } from '@rgossiaux/svelte-headlessui'
import { createEventDispatcher } from "svelte";
export let current: DieValue | 0;
export let nullable = false;
export let invalid = false;
export let dice: DieValue[] = [4, 6, 8, 10, 12];

const dispatch = createEventDispatcher();

$: {
  dispatch('change', current);
}

</script>
<Listbox let:open bind:value={current} class="relative">
  <ListboxButton class="relative w-full cursor-default rounded-md border {invalid ? 'border-red-500 text-red-500' : 'border-gray-300 dark:border-gray-600'} bg-white dark:bg-gray-900 dark:hover:bg-gray-800 py-2 pl-3 pr-10 text-left shadow-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500 sm:text-sm">
    {#if current === 0}
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512" class="w-6 h-6"><path fill="currentColor" d="M315.3 411.3c-6.253 6.253-16.37 6.253-22.63 0L160 278.6l-132.7 132.7c-6.253 6.253-16.37 6.253-22.63 0c-6.253-6.253-6.253-16.37 0-22.63L137.4 256L4.69 123.3c-6.253-6.253-6.253-16.37 0-22.63c6.253-6.253 16.37-6.253 22.63 0L160 233.4l132.7-132.7c6.253-6.253 16.37-6.253 22.63 0c6.253 6.253 6.253 16.37 0 22.63L182.6 256l132.7 132.7C321.6 394.9 321.6 405.1 315.3 411.3z"/></svg>
    {:else}<Die which={current} />{/if}
    <span class="pointer-events-none absolute inset-y-0 right-0 ml-3 flex items-center pr-2">
      <svg class="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
        <path fill-rule="evenodd" d="M10 3a.75.75 0 01.55.24l3.25 3.5a.75.75 0 11-1.1 1.02L10 4.852 7.3 7.76a.75.75 0 01-1.1-1.02l3.25-3.5A.75.75 0 0110 3zm-3.76 9.2a.75.75 0 011.06.04l2.7 2.908 2.7-2.908a.75.75 0 111.1 1.02l-3.25 3.5a.75.75 0 01-1.1 0l-3.25-3.5a.75.75 0 01.04-1.06z" clip-rule="evenodd" />
      </svg>
    </span>
  </ListboxButton>

  <!--
    <span class="pointer-events-none absolute inset-y-0 right-0 ml-3 flex items-center pr-2">
      Heroicon name: mini/chevron-up-down 
      <svg class="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
        <path fill-rule="evenodd" d="M10 3a.75.75 0 01.55.24l3.25 3.5a.75.75 0 11-1.1 1.02L10 4.852 7.3 7.76a.75.75 0 01-1.1-1.02l3.25-3.5A.75.75 0 0110 3zm-3.76 9.2a.75.75 0 011.06.04l2.7 2.908 2.7-2.908a.75.75 0 111.1 1.02l-3.25 3.5a.75.75 0 01-1.1 0l-3.25-3.5a.75.75 0 01.04-1.06z" clip-rule="evenodd" />
      </svg>
    </span>

    Select popover, show/hide based on select state.

    Entering: ""
      From: ""
      To: ""
    Leaving: "transition ease-in duration-100"
      From: "opacity-100"
      To: "opacity-0"
  -->

  {#if open}
  <div class="absolute z-10" transition:scale={{start: 0.5, duration: 100}}>
    <ListboxOptions static class="absolute z-10 mt-1 max-h-64 overflow-auto rounded-md bg-white dark:bg-gray-900 py-1 text-base shadow-lg dark:shadow-purple-400/20 ring-1 ring-black dark:ring-gray-300 ring-opacity-5 focus:outline-none sm:text-sm">
      {#if nullable}
      <ListboxOption value={0} class={({active}) => `relative cursor-default select-none py-2 px-3 ${(active ? 'text-white bg-purple-500' : '')}`}>
        <div class="flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512" class="w-6 h-6"><path fill="currentColor" d="M315.3 411.3c-6.253 6.253-16.37 6.253-22.63 0L160 278.6l-132.7 132.7c-6.253 6.253-16.37 6.253-22.63 0c-6.253-6.253-6.253-16.37 0-22.63L137.4 256L4.69 123.3c-6.253-6.253-6.253-16.37 0-22.63c6.253-6.253 16.37-6.253 22.63 0L160 233.4l132.7-132.7c6.253-6.253 16.37-6.253 22.63 0c6.253 6.253 6.253 16.37 0 22.63L182.6 256l132.7 132.7C321.6 394.9 321.6 405.1 315.3 411.3z"/></svg>
          <div>0</div>
        </div>
      </ListboxOption>
      {/if}
      {#each dice as die}
      <ListboxOption value={die} class={({active}) => `relative cursor-default select-none py-2 px-3 ${(active ? 'text-white bg-purple-500' : '')}`}>
        <div class="flex items-center gap-2">
          <div class="h-6 w-6"><Die which={die}/></div>
          <div>d{die}</div>
        </div>
      </ListboxOption>
      {/each}
    </ListboxOptions>
  </div>
  {/if}
</Listbox>