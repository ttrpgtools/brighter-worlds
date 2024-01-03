<script lang="ts">
  import InputDialog from "$lib/InputDialog.svelte";
  import Toggle from "$lib/Toggle.svelte";
  import type { EulogyStanza } from "$lib/types";
  import { id } from "$lib/rolling/id";
  import { append, remove, update } from "$lib/util/array";

  export let eulogy: EulogyStanza[];

  interface StanzaForm {
    id?: string;
    message: string;
    xp: boolean;
    spent: boolean;
  }

  function newForm(id?: string) {
    if (id) {
      const item = eulogy.find(x => x.id === id);
      if (item != null) {
        return {
          ...item,
        } as EulogyStanza;
      }
    }
    return {
      message: '',
      xp: true,
      spent: false,
    } as StanzaForm;
  }

  let dialog: InputDialog<StanzaForm>;
  let title = '';
  let showDelete = false;
  let form: StanzaForm = newForm();

  async function formResults() {
    const item = await dialog.open();
    if (item != null) {
      const proper: EulogyStanza = {
        ...item,
        id: item.id || id(),
      }
      return proper;
    }
  }

  export async function addStanza() {
    title = 'Add epitaph';
    showDelete = false;
    form = newForm();
    const item = await formResults();
    if (item != null) {
      eulogy = append(eulogy, item);
    }
  }

  export async function editStanza(id: string) {
    title = 'Edit epitaph';
    showDelete = true;
    form = newForm(id);
    const item = await formResults();
    if (item != null) {
      eulogy = update(eulogy, item);
    }
  }

  function removeStanza(ev: CustomEvent<StanzaForm>) {
    const id = ev.detail.id;
    if (id) {
      eulogy = remove(eulogy, id);
    }
  }


</script>
<InputDialog {title} {showDelete} dice={[]} bind:this={dialog} form={form} on:delete={removeStanza}>
  <form class="text-center flex flex-col gap-2">
    <input type="text" name="message" placeholder="Message" bind:value={form.message} class="rounded-full dark:bg-gray-900 dark:text-white focus:ring-purple-500 focus:border-purple-500 flex-grow">
    <div class="flex gap-4 items-center flex-wrap mt-4">
      <div class="flex gap-2 items-center">
        <Toggle bind:value={form.xp} /> Granted XP 
      </div>
      {#if form.xp && showDelete}
      <div class="flex gap-2 items-center">
        <Toggle bind:value={form.spent} /> Used XP 
      </div>
      {/if}
    </div>
  </form>
</InputDialog>