<script lang="ts">
  import RollableTable from '$lib/RollableTable.svelte';
  import type { RolltableOption, TableRoll } from '$lib/types';
  import type { Snippet } from 'svelte';
  interface Props {
    title: string;
    options: RolltableOption[];
    formula: string;
    menu?: Snippet<[() => void]>;
    onroll: (res: TableRoll<RolltableOption>) => void;
    onclick?: () => void;
  }

  let { title, options, formula, menu, onroll, onclick }: Props = $props();

  let table: RollableTable<RolltableOption> | undefined = $state();

  function manualRoll(opt: RolltableOption) {
    const tableRoll: TableRoll<RolltableOption> = {
      title,
      roll: Array.isArray(opt.trigger) ? opt.trigger[0] : opt.trigger,
      value: [opt],
    };
    onroll(tableRoll);
  }

  export async function rollTable(pre?: number) {
    await table?.rollTable(pre);
  }
  export async function getResult(pre?: number) {
    return await table?.getResult(pre);
  }
</script>

<RollableTable {options} {title} {formula} {menu} {onroll} {onclick} bind:this={table}>
  {#snippet children({ opt })}
    <div class="flex gap-2 items-center -ml-4">
      <button
        type="button"
        aria-label="Manual roll"
        title="Add manually"
        onclick={() => manualRoll(opt)}
        class="w-2 h-2 rounded-full {opt.type === 'text' ? `bg-gray-500` : `bg-purple-500`}"
      ></button>
      <div class="flex-1 line-clamp-1">
        {#if opt.type === 'entity'}{opt.value.name}{:else}{opt.value}{/if}
      </div>
      <div class="ml-auto">
        {#if Array.isArray(opt.trigger)}{opt.trigger[0]}-{opt.trigger[1]}{:else}{opt.trigger}{/if}
      </div>
    </div>
  {/snippet}
</RollableTable>
