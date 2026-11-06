<script lang="ts">
  import AutoTextarea from '$lib/AutoTextarea.svelte';
  import InputDialog from '$lib/InputDialog.svelte';
  import Button from '$lib/ui/button.svelte';
  import { id } from '$lib/rolling/id';
  import type { Scene } from '$lib/types';
  import { cloneEditorDraft, isOptionalImage } from '$lib/util/gm-editor-validation';

  interface DialogForm {
    id: string;
    name: string;
    desc: string;
    image: string | Blob;
    gmnotes: string;
  }
  let { ondelete }: { ondelete: (form: DialogForm) => void } = $props();
  function newForm(): DialogForm {
    return { id: id(), name: '', desc: '', image: '', gmnotes: '' };
  }
  function editForm(existing: Scene): DialogForm {
    return cloneEditorDraft({
      id: existing.id,
      name: existing.name,
      desc: existing.desc ?? '',
      image: existing.image ?? '',
      gmnotes: existing.gmnotes ?? '',
    });
  }
  let dialog: InputDialog<DialogForm> | undefined = $state();
  let form: DialogForm = $state(newForm());
  let editing = $state(false);
  let dirty = $state({ name: false, image: false });
  let imageError = $derived(
    isOptionalImage(form.image) ? '' : 'Use an image URL or relative image path.',
  );
  let valid = $derived(!!form.name.trim() && !imageError);
  async function showForm() {
    const item = await dialog?.open();
    if (item && valid)
      return cloneEditorDraft({
        id: item.id,
        name: item.name.trim(),
        desc: item.desc,
        image: typeof item.image === 'string' ? item.image.trim() : item.image,
        gmnotes: item.gmnotes,
        icon: 'nav-scenes',
      }) as Scene;
  }
  export async function getNew() {
    dirty = { name: false, image: false };
    editing = false;
    form = newForm();
    return showForm();
  }
  export async function edit(existing: Scene) {
    dirty = { name: false, image: false };
    editing = true;
    form = editForm(existing);
    return showForm();
  }
</script>

<InputDialog
  title={editing ? 'Edit Scene' : 'New Scene'}
  okBtnLabel={editing ? 'Save changes' : 'Create'}
  {valid}
  showDelete={false}
  bind:this={dialog}
  {form}
  {ondelete}
>
  <div class="flex flex-col gap-3 text-left">
    <label class="flex flex-col gap-1"
      >Name
      <input
        type="text"
        data-1p-ignore
        bind:value={form.name}
        oninput={() => (dirty.name = true)}
        aria-invalid={dirty.name && !form.name.trim()}
        class="rounded-full dark:bg-gray-900 dark:text-white focus:ring-purple-500 focus:border-purple-500"
      />
      {#if dirty.name && !form.name.trim()}<span class="text-sm text-red-700 dark:text-red-300"
          >Enter a name.</span
        >{/if}
    </label>
    {#if typeof form.image === 'string'}
      <label class="flex flex-col gap-1"
        >Image URL (optional)
        <input
          type="text"
          bind:value={form.image}
          oninput={() => (dirty.image = true)}
          aria-invalid={dirty.image && !!imageError}
          class="rounded-full dark:bg-gray-900 dark:text-white focus:ring-purple-500 focus:border-purple-500"
        />
        {#if dirty.image && imageError}<span class="text-sm text-red-700 dark:text-red-300"
            >{imageError}</span
          >{/if}
      </label>
    {:else}
      <div class="flex items-center gap-2">
        <span>Saved image</span><Button
          size="sm"
          variant="ghost"
          onclick={() => {
            dirty.image = true;
            form.image = '';
          }}>Remove image</Button
        >
      </div>
    {/if}
    <label for="scene-description">Description</label>
    <AutoTextarea id="scene-description" bind:value={form.desc} maxRows={12} minRows={2} />
    <label for="gmnotes-scene">GM Notes</label>
    <AutoTextarea id="gmnotes-scene" bind:value={form.gmnotes} maxRows={12} minRows={3} />
  </div>
</InputDialog>
