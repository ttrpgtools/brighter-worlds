<script lang="ts">
  import InputDialog from '$lib/InputDialog.svelte';
  import type { NpcStats } from '$lib/types';
  import { cloneEditorDraft } from '$lib/util/gm-editor-validation';

  interface Props {
    npcList?: NpcStats[];
  }

  let { npcList = [] }: Props = $props();

  interface DialogForm {
    selected: NpcStats | undefined;
  }

  function newForm() {
    return {
      selected: undefined,
    } as DialogForm;
  }

  let dialog: InputDialog<DialogForm> | undefined = $state();
  let form: DialogForm = $state(newForm());

  async function showForm() {
    const item = await dialog?.open();
    if (item != null && item.selected) {
      return cloneEditorDraft(item.selected);
    }
  }

  export async function select() {
    form = newForm();
    const item = await showForm();
    return item;
  }
</script>

<InputDialog
  title="Choose NPC"
  okBtnLabel="Add NPC"
  valid={!!form.selected}
  showDelete={false}
  dice={[]}
  bind:this={dialog}
  {form}
>
  <div class="text-center flex flex-col gap-2">
    <label for="encounter-npc-selection">NPC template</label>
    <select
      id="encounter-npc-selection"
      bind:value={form.selected}
      class="rounded-full dark:bg-gray-900 dark:text-white focus:ring-purple-500 focus:border-purple-500"
    >
      <option value={undefined}>Choose an NPC</option>
      {#each npcList as npc (npc.id)}
        <option value={npc}>{npc.name === 'Untitled' ? `New Blank` : npc.name}</option>
      {/each}
    </select>
  </div>
</InputDialog>
