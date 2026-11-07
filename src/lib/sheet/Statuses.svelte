<script lang="ts">
  import { status } from '$lib/const';
  import Button from '$lib/ui/button.svelte';
  import StatusButton from './StatusButton.svelte';
  import StatusesDialog from './StatusesDialog.svelte';

  type StatusesProps = {
    statuses: Set<string>;
  };
  let { statuses = $bindable(new Set<string>()) }: StatusesProps = $props();

  let dialog: StatusesDialog | undefined = $state();

  function toggleStatus(status: string) {
    if (statuses.has(status)) {
      statuses.delete(status);
    } else {
      statuses.add(status);
    }
    statuses = statuses;
  }

  let isDeprived = $derived(statuses.has(status.DEPRIVED));
</script>

<!-- <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" class="-ml-0.5 mr-2 h-4 w-4 text-gray-400 dark:text-gray-500" class:!text-purple-800={isDeprived} class:dark:!text-purple-100={isDeprived}></svg> -->
<StatusesDialog bind:statuses bind:this={dialog} />
<div class="flex overflow-y-auto">
  <div class="flex items-center gap-2 flex-wrap grow">
    <StatusButton
      onclick={() => toggleStatus(status.DEPRIVED)}
      status="deprived"
      enabled={isDeprived}
    />
    {#each Array.from(statuses.values()) as stat}
      {#if stat !== status.DEPRIVED}
        <StatusButton onclick={() => toggleStatus(stat)} status={stat} />
      {/if}
    {/each}
  </div>
  <div class="flex items-start pt-1.5 pl-2">
    <Button
      class="border-0"
      icon="plus"
      size="tight"
      iconClass="size-4"
      onclick={() => dialog?.add()}
    />
  </div>
</div>
