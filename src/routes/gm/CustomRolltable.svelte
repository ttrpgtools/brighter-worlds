<script lang="ts">
  import RollableTable from "$lib/RollableTable.svelte";
  import type { RolltableOption, TableRoll } from "$lib/types";
  import { createEventDispatcher } from "svelte";
  export let title: string;
  export let options: RolltableOption[];
  export let formula: string;

  const dispatch = createEventDispatcher<{roll: TableRoll<RolltableOption>}>();
  function handleRoll(ev: CustomEvent<TableRoll<RolltableOption>>) {
    dispatch('roll', ev.detail);
  }
</script>

<RollableTable {options} let:opt {title} {formula} on:roll={handleRoll} on:click>
  <div class="flex gap-2 items-center -ml-4">
    <div class="w-2 h-2 rounded-full {opt.type === 'text' ? `bg-gray-500` : `bg-purple-500`}"></div>
    <div class="flex-1 line-clamp-1">{#if opt.type === 'entity'}{opt.value.name}{:else}{opt.value}{/if}</div>
    <div class="ml-auto">{#if Array.isArray(opt.trigger)}{opt.trigger[0]}-{opt.trigger[1]}{:else}{opt.trigger}{/if}</div>
  </div>
</RollableTable>