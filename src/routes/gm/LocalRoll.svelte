<script lang="ts">
  import type { LogRoll } from '$lib/types';
  interface Props {
    item: LogRoll;
    ondelete: (id: string) => void;
  }

  let { item, ondelete }: Props = $props();
  let diceStr = $derived(
    item.roll.dice.length ? ` (${item.roll.dice.map((s) => `d${s}`).join(' | ')})` : ``
  );
</script>

<div class="border border-gray-200 dark:border-gray-600 rounded-md p-3 relative group/roll">
  <span class="font-bold">{item.roll.result}</span>
  {diceStr}{item.roll.label ? ` — ` : ``}{item.roll.label}
  <button
    type="button"
    onclick={() => ondelete(item.id)}
    class="opacity-0 transition-opacity absolute top-2 right-2 text-lg rounded-full leading-none h-6 w-6 bg-purple-300 dark:bg-purple-900 group-hover/roll:opacity-100 flex items-center justify-center"
    ><span class="relative -top-px">&times;</span></button
  >
</div>
