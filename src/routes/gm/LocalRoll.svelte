<script lang="ts">
  import type { LogRoll } from "$lib/types";
  import { createEventDispatcher } from "svelte";
  export let item: LogRoll;
  $: diceStr = item.roll.dice.length ? ` (${item.roll.dice.map(s => `d${s}`).join(' | ')})` : ``
  const dispatch = createEventDispatcher();
</script>
<div class="border border-gray-200 dark:border-gray-600 rounded-md p-3 relative group/roll">
  <span class="font-bold">{item.roll.result}</span> {diceStr}{item.roll.label ? ` — ` : ``}{item.roll.label}
  <button type="button" on:click={() => dispatch('delete', item.id)} class="opacity-0 transition-opacity absolute top-2 right-2 text-lg rounded-full leading-none h-6 w-6 bg-purple-300 dark:bg-purple-900 group-hover/roll:opacity-100 flex items-center justify-center"><span class="relative -top-px">&times;</span></button>
</div>