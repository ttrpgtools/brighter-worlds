<script lang="ts">
  import { status } from '$lib/const';
  import StatusButton from './StatusButton.svelte';
  import StatusesDialog from './StatusesDialog.svelte';

  export let statuses = new Set<string>();

  let dialog: StatusesDialog

  function toggleStatus(status: string) {
    if (statuses.has(status)) {
      statuses.delete(status);
    } else {
      statuses.add(status);
    }
    statuses = statuses;
  }

  $: isDeprived = statuses.has(status.DEPRIVED);
</script>
<!-- <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" class="-ml-0.5 mr-2 h-4 w-4 text-gray-400 dark:text-gray-500" class:!text-purple-800={isDeprived} class:dark:!text-purple-100={isDeprived}></svg> -->
<StatusesDialog bind:statuses bind:this={dialog} />
<div class="flex">
  <div class="flex items-center gap-2 flex-wrap flex-grow">
    <StatusButton on:click={() => toggleStatus(status.DEPRIVED)} status="deprived" enabled={isDeprived} size="1.375rem" />
    {#each Array.from(statuses.values()) as stat}
      {#if stat !== status.DEPRIVED}
      <StatusButton on:click={() => toggleStatus(stat)} status={stat} />
      {/if}
    {/each}
  </div>
  <div class="flex items-start pt-1.5 pl-2">
    <button type="button" on:click={() => dialog.add()} class="relative inline-flex items-center rounded-full bg-purple-300 dark:bg-purple-700 p-1 font-medium shadow-sm hover:bg-purple-200 dark:hover:bg-purple-800 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-900"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" class="h-4 w-4"><path fill="currentColor" d="M256 80c0-17.7-14.3-32-32-32s-32 14.3-32 32V224H48c-17.7 0-32 14.3-32 32s14.3 32 32 32H192V432c0 17.7 14.3 32 32 32s32-14.3 32-32V288H400c17.7 0 32-14.3 32-32s-14.3-32-32-32H256V80z"/></svg></button>
  </div>
</div>