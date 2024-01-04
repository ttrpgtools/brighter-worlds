<script lang="ts">
  import RollableTable from "$lib/RollableTable.svelte";
  import type { RolltableOption, TableRoll } from "$lib/types";
  import { createEventDispatcher } from "svelte";
  export let title: string;
  export let options: RolltableOption[];
  export let formula: string;

  let table: RollableTable<RolltableOption>;

  const dispatch = createEventDispatcher<{roll: TableRoll<RolltableOption>}>();
  function handleRoll(ev: CustomEvent<TableRoll<RolltableOption>>) {
    dispatch('roll', ev.detail);
  }
  function manualRoll(opt: RolltableOption) {
    const tableRoll: TableRoll<RolltableOption> = {
      title,
      roll: Array.isArray(opt.trigger) ? opt.trigger[0] : opt.trigger,
      value: [opt],
    };
    dispatch('roll', tableRoll);
  }

  export async function rollTable(pre?: number) {
    await table.rollTable(pre);
  }
  export async function getResult(pre?: number) {
    return await table.getResult(pre);
  }
</script>

<RollableTable {options} let:opt {title} {formula} on:roll={handleRoll} on:click bind:this={table}>
  <div class="flex gap-2 items-center -ml-4">
    <button type="button" title="Add manually" on:click={() => manualRoll(opt)} class="w-2 h-2 rounded-full {opt.type === 'text' ? `bg-gray-500` : `bg-purple-500`}"></button>
    <div class="flex-1 line-clamp-1">{#if opt.type === 'entity'}{opt.value.name}{:else}{opt.value}{/if}</div>
    <div class="ml-auto">{#if Array.isArray(opt.trigger)}{opt.trigger[0]}-{opt.trigger[1]}{:else}{opt.trigger}{/if}</div>
  </div>
</RollableTable>