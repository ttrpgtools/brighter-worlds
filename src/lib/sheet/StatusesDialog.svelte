<script lang="ts">
  import InputDialog from '$lib/InputDialog.svelte';
  import { KNOWN_STATUSES, status } from '$lib/const';
  import StatusButton from './StatusButton.svelte';

  let { statuses = $bindable(new Set<string>()) } = $props();

  const statusList = Array.from(KNOWN_STATUSES.values()).map((x) => ({ name: x }));

  interface StatusForm {
    status: string;
  }

  function newForm() {
    return {
      status: '',
    } as StatusForm;
  }

  let dialog: InputDialog<StatusForm> | undefined = $state();
  let title = $state('');
  let showDelete = $state(false);
  let form: StatusForm = $state(newForm());

  async function formResults() {
    const item = await dialog?.open();
    if (item != null) {
      return item.status.toLowerCase();
    }
  }

  export async function add() {
    title = 'Add status';
    showDelete = false;
    form = newForm();
    const item = await formResults();
    if (item) {
      statuses.add(item);
      statuses = statuses;
    }
  }

  function pick(status: string) {
    dialog?.close({ status });
  }
</script>

<InputDialog {title} {showDelete} dice={[]} bind:this={dialog} {form}>
  <form class="text-center flex flex-col gap-3">
    <input
      type="text"
      name="status"
      placeholder="Custom status"
      bind:value={form.status}
      class="rounded-full dark:bg-gray-900 dark:text-white focus:ring-purple-500 focus:border-purple-500 flex-grow"
    />
    <div class="grid grid-cols-2 gap-3">
      {#each statusList as stat}
        {#if stat.name !== status.DEPRIVED && !statuses.has(stat.name)}
          <StatusButton status={stat.name} enabled={false} onclick={() => pick(stat.name)} />
        {/if}
      {/each}
    </div>
  </form>
</InputDialog>
