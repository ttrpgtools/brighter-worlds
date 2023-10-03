<script lang="ts">
  import InputDialog from "$lib/InputDialog.svelte";
  import { id } from "$lib/rolling/id";
  import type { NpcStats, CustomRolltableDef, RolltableOption, Encounter, Item } from "$lib/types";

  export let npcList: NpcStats[] = [];
  export let encList: Encounter[] = [];
  export let relicList: Item[] = [];

  interface DialogForm {
    id: string;
    name: string;
    formula: string;
    options: RolltableOption[];
  }

  function newForm() {
    return {
      id: id(),
      name: '',
      formula: '',
      options: [],
    } as DialogForm;
  }

  function editForm(existing: CustomRolltableDef) {
    const { id, name, formula, options } = existing;
    return {
      id, name, formula, options
    } as DialogForm;
  }

  let dialog: InputDialog<DialogForm>;
  let form: DialogForm = newForm();

  $: valid = !!form.name && !!form.formula && form.options.length > 0;

  async function showForm() {
    const item = await dialog.open();
    if (item != null) {
      return {
        id: item.id,
        name: item.name,
        formula: item.formula,
        options: item.options,
      } as CustomRolltableDef;
    }
  }

  export async function getNew() {
    form = newForm();
    const item = await showForm();
    return item;
  }

  export async function edit(existing: CustomRolltableDef) {
    form = editForm(existing);
    const item = await showForm();
    return item;
  }

  function addOption() {
    form.options = [...form.options, {type: 'text', value: '', trigger: form.options.length + 1 }];
    form = form;
  } 
</script>
<InputDialog title="Roll Table" scrollable={false} {valid} showDelete={false} dice={[]} bind:this={dialog} form={form}>
  <form class="text-center flex flex-col gap-2">
    <input type="text" data-1p-ignore name="name" placeholder="Name" bind:value={form.name} class="rounded-full dark:bg-gray-900 dark:text-white focus:ring-purple-500 focus:border-purple-500">
    <input type="text" name="formula" placeholder="Formula" bind:value={form.formula} class="rounded-full dark:bg-gray-900 dark:text-white focus:ring-purple-500 focus:border-purple-500">
    <div class="flex justify-between">
      <div class="">Options</div>
      <button type="button" on:click={addOption}>
        <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-purple-500" viewBox="0 0 512 512" fill="currentColor"><path d="M288 32l0-32H224l0 32 0 192H32 0v64H32 224V480v32h64V480 288l192 0 32 0 0-64-32 0-192 0 0-192z"/></svg>
      </button>
    </div>
    {#each form.options as opt, oi}
      <div class="flex gap-2">
        <div><select bind:value={form.options[oi].type} class="rounded-full dark:bg-gray-900 dark:text-white focus:ring-purple-500 focus:border-purple-500">
          <option value="text">text</option>
          <option value="entity">entity</option>
        </select></div>
        <div class="flex-1 flex-shrink">
          {#if form.options[oi].type === 'text'}
          <input type="text" name="value" placeholder="Value" bind:value={form.options[oi].value} class="rounded-full dark:bg-gray-900 dark:text-white focus:ring-purple-500 focus:border-purple-500">
          {:else}
          <select bind:value={form.options[oi].value} class="w-full rounded-full dark:bg-gray-900 dark:text-white focus:ring-purple-500 focus:border-purple-500">
            <optgroup label="Encounters">
              {#each encList as item}
                <option value={item}>{item.name}</option>
              {/each}
            </optgroup>
            <optgroup label="Items">
              {#each relicList as item}
                <option value={item}>{item.name}</option>
              {/each}
            </optgroup>
            <optgroup label="NPCs">
              {#each npcList as item}
                <option value={item}>{item.name}</option>
              {/each}
            </optgroup>
          </select>
          {/if}
        </div>
        <div>
          <input type="text" name="trigger" size="6" placeholder="Trigger" bind:value={form.options[oi].trigger} class="rounded-full dark:bg-gray-900 dark:text-white focus:ring-purple-500 focus:border-purple-500">
        </div>
      </div>
    {/each}
  </form>
</InputDialog>