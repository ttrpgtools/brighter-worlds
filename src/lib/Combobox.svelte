<script lang="ts">
  import { createCombobox } from 'svelte-headlessui';
  import type {Named} from './types';

  export type T = $$Generic<Named>;
  export let options: T[];
  export let selectedValue: T | undefined = undefined;
  export let textValue = '';
  export let placeholder = '';

  console.log('INIT CB', selectedValue);
  const combobox = createCombobox({ label: placeholder, selected: selectedValue });
  $: { if (selectedValue) combobox.set({selected: selectedValue}); console.log('UPDATE CB', selectedValue)}
  $: filtered = options.filter(opt => opt.name.toLowerCase().replace(/\s+/g, '').includes($combobox.filter.toLowerCase().replace(/\s+/g, '')))

</script>
<div>
  <div class="relative mt-1">
    <input {placeholder} data-1p-ignore use:combobox.input on:select type="text" class="w-full rounded-full dark:bg-gray-900 dark:text-white focus:ring-purple-500 focus:border-purple-500" bind:value={textValue}>
    <button type="button" use:combobox.button class="absolute inset-y-0 right-0 flex items-center rounded-r-md px-2 focus:outline-none">
      <svg class="h-5 w-5 text-purple-700 dark:text-purple-300" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
        <path fill-rule="evenodd" d="M10 3a.75.75 0 01.55.24l3.25 3.5a.75.75 0 11-1.1 1.02L10 4.852 7.3 7.76a.75.75 0 01-1.1-1.02l3.25-3.5A.75.75 0 0110 3zm-3.76 9.2a.75.75 0 011.06.04l2.7 2.908 2.7-2.908a.75.75 0 111.1 1.02l-3.25 3.5a.75.75 0 01-1.1 0l-3.25-3.5a.75.75 0 01.04-1.06z" clip-rule="evenodd" />
      </svg>
    </button>
    {#if $combobox.expanded}
    <ul use:combobox.items class="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white dark:bg-gray-900 py-1 text-base shadow-lg dark:shadow-purple-400/20 ring-1 ring-black dark:ring-gray-500 ring-opacity-5 focus:outline-none sm:text-sm">
      {#each filtered as value}
        {@const active = $combobox.active === value}
        {@const selected = $combobox.selected === value}
        <li use:combobox.item={{ value }} class="relative cursor-default select-none py-2 px-3 {active ? 'bg-purple-700 dark:bg-purple-300 text-white dark:text-gray-900' : 'text-gray-900 dark:text-white'}">
          <div class="flex">
            <slot {value} {active} {selected}>{#if selected}&bull; {/if}{value.name}</slot>
          </div>
        </li>
      {:else}
        <li class="relative cursor-default select-none py-2 pl-10 pr-4">
          <span class="block truncate font-normal">Nothing found</span>
        </li>
      {/each}
    </ul>
    {/if}
  </div>
</div>