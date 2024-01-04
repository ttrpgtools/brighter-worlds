<script lang="ts">
  import AutoTextarea from "$lib/AutoTextarea.svelte";
  import InputDialog from "$lib/InputDialog.svelte";
  import { id } from "$lib/rolling/id";
  import type { Scene } from "$lib/types";

  interface DialogForm {
    id: string;
    name: string;
    desc: string;
    image: string;
    gmnotes: string;
  }

  function newForm() {
    return {
      id: id(),
      name: '',
      desc: '',
      image: '',
      gmnotes: '',
    } as DialogForm;
  }

  function editForm(existing: Scene) {
    const { id, name, desc, image, gmnotes } = existing;
    return {
      id, name, desc, image, gmnotes
    } as DialogForm;
  }

  let dialog: InputDialog<DialogForm>;
  let form: DialogForm = newForm();

  $: valid = !!form.name;

  async function showForm() {
    const item = await dialog.open();
    if (item != null) {
      const core = {
        id: item.id,
        name: item.name,
        desc: item.desc,
        image: item.image,
        icon: 'nav-scenes',
      } as Scene;
      if (item.gmnotes) {
        core.gmnotes = item.gmnotes;
      }
      return core;
    }
  }

  let showDelete = false;

  export async function getNew() {
    showDelete = false;
    form = newForm();
    const item = await showForm();
    return item;
  }

  export async function edit(existing: Scene) {
    showDelete = true;
    form = editForm(existing);
    const item = await showForm();
    return item;
  }

</script>
<InputDialog title="Scene" scrollable={false} {valid} {showDelete} dice={[]} bind:this={dialog} form={form} on:delete>
  <form class="text-center flex flex-col gap-2">
    <input type="text" data-1p-ignore name="name" placeholder="Name" bind:value={form.name} class="rounded-full dark:bg-gray-900 dark:text-white focus:ring-purple-500 focus:border-purple-500">
    <input type="text" name="image" placeholder="Image URL" bind:value={form.image} class="rounded-full dark:bg-gray-900 dark:text-white focus:ring-purple-500 focus:border-purple-500">
    <AutoTextarea bind:value={form.desc} maxRows={12} minRows={2}></AutoTextarea>
    <label for="gmnotes-scene">GM Notes</label>
    <AutoTextarea id="gmnotes-scene" bind:value={form.gmnotes} maxRows={12} minRows={3}></AutoTextarea>
  </form>
</InputDialog>