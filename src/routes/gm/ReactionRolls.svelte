<script lang="ts">
  import Card from "$lib/Disclosable.svelte";
  import { rolls } from "$lib/rolling/roll";
  import type { TableRoll } from "$lib/types";
  import { createEventDispatcher } from "svelte";

  const dispatch = createEventDispatcher<{roll: TableRoll<string>}>();

  let reaction = 'Pending...';
  let rolled = false;
  let indicator = 'bg-transparent';

  function rollReaction() {
    const results = rolls(6, 2); // 2d6
    const total = results.reduce((p, c) => p + c, 0);
    const [text, color] = total >= 11 ? ['Extremely negative', 'bg-rose-700']
                : total >= 8 ? ['Negative', 'bg-rose-400']
                : total === 7 ? ['Neutral', 'bg-gray-400']
                : total >= 4 ? ['Positive', 'bg-emerald-400']
                : ['Extremely positive', 'bg-emerald-700'];
    reaction = `${text} (${results[0]} + ${results[1]})`;
    indicator = color;
    rolled = true;
    dispatch('roll', { dice: [6, 6], value: [text], roll: total, title: 'Reaction Roll' });
  }
</script>

<Card bind:open={rolled}>
  <svelte:fragment slot="header">
    <div class="pr-2">
      <h3 class="text-xl font-subtitle leading-6">Reaction Roll</h3>
    </div>
    <div class="flex-shrink-0 ml-auto">
      <button type="button" on:click={rollReaction} class="relative inline-flex items-center rounded-full disabled:cursor-not-allowed bg-purple-300 dark:bg-purple-700 p-1 font-medium shadow-sm hover:bg-purple-200 dark:hover:bg-purple-800 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-900">Roll</button>
    </div>
  </svelte:fragment>
  <div class="flex justify-between items-center">
    <span>{reaction}</span>
    <span class="block w-3 h-3 rounded-full {indicator}"></span>
  </div>
</Card>

