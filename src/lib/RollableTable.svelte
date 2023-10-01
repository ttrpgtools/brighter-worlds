<script lang="ts">
  import { createEventDispatcher, tick } from "svelte";
  import Card from "./Card.svelte";
  import Die, { knownDie } from "./dice/Die.svelte";
  import { rolls } from "./rolling/roll";
  import type { TableRoll, DieValue } from "./types";

  type T = $$Generic;
  export let options: T[];
  export let title: string;
  export let die: DieValue | undefined = undefined;
  export let once = false;

  let rolled: number = 0;
  
  const dispatch = createEventDispatcher<{roll: TableRoll<T>}>();

  $: sides = Math.min(die ?? options.length, options.length);

  function alt(i: number) {
    const last = i === (options.length - 1) ? 'rounded-b-lg' : '';
    return (i + 1) === rolled
      ? `bg-purple-700 text-white dark:bg-purple-300 dark:text-gray-900 ${last}`
      : (i % 2 !== 0 ? `bg-gray-200 dark:bg-gray-800 ${last}` : last);
  }

  function snap(r: number) {
    if (r < 0) return 0;
    if (r > sides || r > options.length) return Math.min(sides, options.length);
    return r;
  }

  const SHUFFLE_DELAY = 90;
  function waitFor(spot: number) {
    return new Promise<number>(res => setTimeout(() => res(spot), SHUFFLE_DELAY));
  }

  function* waitOn(spots: number[]) {
    while (spots.length) {
      yield waitFor(spots.pop() ?? 0);
    }
  }

  async function doShuffle(spots: number[]) {
    for await (const offset of waitOn(spots)) {
      shuffle = offset;
    }
  }

  const SHUFFLE_COUNT = 10;
  let shuffle = 0;
  export async function rollTable(preRoll?: number) {
    shuffle = 0;
    if (preRoll != null) {
      rolled = snap(preRoll);
    } else {
      rolled = 0;
      const shuffles = rolls(sides, SHUFFLE_COUNT);
      const final = shuffles[0];
      // Await Animation
      await doShuffle(shuffles);
      rolled = final;
    }
    const selected = options[rolled - 1];
    if (selected != null) {
      if (knownDie(sides)) {
        dispatch('roll', { roll: rolled, value: selected, title, dice: [sides] });
      } else {
        dispatch('roll', { roll: rolled, value: selected, title, total: sides });
      }
    }
  }
</script>
<Card>
  <svelte:fragment slot="header">
    <div class="pr-2">
      <h3 class="text-xl font-subtitle leading-6">{title}</h3>
    </div>
    <div class="flex-shrink-0">
      <div class="flex gap-4 items-center">
        <button type="button" on:click={() => (!once || rolled === 0) && rollTable()} disabled={once && rolled > 0} class="relative inline-flex items-center rounded-full disabled:cursor-not-allowed bg-purple-300 dark:bg-purple-700 p-1 font-medium shadow-sm hover:bg-purple-200 dark:hover:bg-purple-800 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-900">{#if knownDie(sides)}<Die which={sides} />{:else}Roll{/if}</button>
      </div>
    </div>
  </svelte:fragment>
  <ul class="-mx-4 -my-5 sm:-mx-6 rounded-b-lg relative">
    <div class="absolute py-2 px-4 sm:px-6 border-2 border-purple-400 dark:border-purple-600 w-full" class:rounded-b-lg={shuffle === options.length} class:hidden={shuffle === 0} style:transform={`translateY(${(shuffle - 1) * 100}%)`}>&nbsp;</div>
    {#each options as opt, oi}
    <li class="py-2 px-4 sm:px-6 border-2 border-transparent {alt(oi)} {rolled === (oi + 1) ? 'bg-purple-700 text-white dark:bg-purple-300 dark:text-gray-900' : ''}"><slot {opt}>{opt}</slot></li>
    {/each}
  </ul>
</Card>