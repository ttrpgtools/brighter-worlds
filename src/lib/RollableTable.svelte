<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import Card from "./Card.svelte";
  import Die, { knownDie } from "./dice/Die.svelte";
  import { roll } from "./rolling/roll";
  import type { TableRoll, DieValue } from "./types";

  type T = $$Generic;
  export let options: T[];
  export let labelSelect = (opt: T) => opt as string;
  export let title: string;
  export let die: DieValue | undefined = undefined;
  
  const dispatch = createEventDispatcher<{roll: TableRoll<T>}>();

  let rolled: number = 0;

  $: sides = Math.min(die ?? options.length, options.length);

  function alt(i: number) {
    const last = i === options.length -1 ? 'rounded-b-lg' : '';
    return i % 2 !== 0 ? `bg-gray-200 dark:bg-gray-800 ${last}` : last;
  }

  export function rollTable() {
    rolled = roll(sides);
    const tRoll = { roll: rolled, value: options[rolled - 1] };
    dispatch('roll', tRoll);
  }
</script>
<Card>
  <svelte:fragment slot="header">
    <div class="pr-2">
      <h3 class="text-xl font-subtitle leading-6">{title}</h3>
    </div>
    <div class="flex-shrink-0">
      <div class="flex gap-4 items-center">
        <button type="button" on:click={rollTable} class="relative inline-flex items-center rounded-full bg-purple-300 dark:bg-purple-700 p-1 font-medium shadow-sm hover:bg-purple-200 dark:hover:bg-purple-800 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-900">{#if knownDie(sides)}<Die which={sides} />{:else}Roll{/if}</button>
      </div>
    </div>
  </svelte:fragment>
  <ul class="-mx-4 -my-5 sm:-m-6 rounded-b-lg">
    {#each options as opt, oi}
    <li class="py-2 px-4 sm:px-6 {alt(oi)} {rolled === (oi + 1) ? 'bg-purple-700 text-white dark:bg-purple-300 dark:text-gray-900' : ''}">{labelSelect(opt)}</li>
    {/each}
  </ul>
</Card>