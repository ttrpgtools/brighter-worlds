<script lang="ts">
  import InputDialog from "$lib/InputDialog.svelte";
  import type { NpcStats } from "$lib/types";

  export let npcList: NpcStats[] = [];

  interface DialogForm {
    selected: NpcStats | undefined;
  }

  function newForm() {
    return {
      selected: undefined
    } as DialogForm;
  }

  let dialog: InputDialog<DialogForm>;
  let form: DialogForm = newForm();

  async function showForm() {
    const item = await dialog.open();
    if (item != null && item.selected) {
      return item.selected;
    }
  }

  export async function select() {
    form = newForm();
    const item = await showForm();
    return item;
  }
</script>
<InputDialog title="Choose NPC" scrollable={false} showDelete={false} dice={[]} bind:this={dialog} form={form}>
  <form class="text-center flex flex-col gap-2">
    <select bind:value={form.selected} class="rounded-full dark:bg-gray-900 dark:text-white focus:ring-purple-500 focus:border-purple-500">
      {#each npcList as npc}
      <option value={npc}>{npc.name === 'Untitled' ? `New Blank` : npc.name}</option>
      {/each}
    </select>
  </form>
</InputDialog>