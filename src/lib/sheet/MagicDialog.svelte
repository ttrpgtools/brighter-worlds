<script lang="ts">
  import InputDialog from "$lib/InputDialog.svelte";
  import { id } from "$lib/rolling/id";
  import Toggle from "$lib/Toggle.svelte";
  import type { DieValue, Magic, Ritual } from "$lib/types";
  import DieSelector from "./DieSelector.svelte";
  import { spellManager, ritualManager } from "$lib/data/magic-manager";
  import { append, remove, update } from "$lib/util/array";
  import Combobox from "$lib/Combobox.svelte";

  type T = $$Generic<Magic>
  export let magicList: T[] = [];
  type TType = T["type"]
  export let type: TType;
  
  const builtin: Magic[] = type === 'spell' ? spellManager.getAll() : ritualManager.getAll();

  let selectedMagic: T | undefined;

  interface MagicForm {
    id?: string;
    name: string;
    desc: string;
    damage: DieValue | 0;
    blast: boolean;
  }

  function newMagicForm(id?: string) {
    if (id) {
      const magic = magicList.find(x => x.id === id);
      selectedMagic = builtin.find(b => b.name === magic?.name && b.desc === magic?.desc) as T;
      if (magic != null) {
        return {
          ...magic,
          damage: magic.damage ?? 0,
        } as MagicForm;
      }
    }
    return {
      name: '',
      desc: '',
      damage: 0,
      blast: false,
    } as MagicForm;
  }

  let magicDialog: InputDialog<MagicForm>;
  let magicDialogTitle = '';
  let magicDialogDelete = false;
  let magicForm: MagicForm = newMagicForm();
  let descField: HTMLInputElement;

  async function arcaneForm() {
    const item = await magicDialog.open();
    if (item != null && item.name !== '') {
      const proper: T = {
        id: item.id || id(),
        type,
        name: item.name,
        desc: item.desc,
        blast: item.blast,
      } as T;
      if (item.damage !== 0) {
        proper.damage = item.damage;
      }
      return proper;
    }
  }

  export async function addMagic() {
    magicDialogTitle = `Add ${type}`;
    magicDialogDelete = false;
    magicForm = newMagicForm();
    const item = await arcaneForm();
    if (item != null) {
      magicList = append(magicList, item);
    }
  }

  export async function editMagic(id: string) {
    magicDialogTitle = `Edit ${type}`;
    magicDialogDelete = true;
    magicForm = newMagicForm(id);
    const item = await arcaneForm();
    if (item != null) {
      magicList = update(magicList, item);
    }
  }

  function removeMagic(ev: CustomEvent<MagicForm>) {
    const id = ev.detail.id;
    if (id) {
      magicList = remove(magicList, id);
    }
  }

  function pickMagic(ev: Event) {
    if(!(ev as CustomEvent).detail) return;
    const {name, desc, damage, blast} = (ev as CustomEvent<{selected: T}>).detail.selected;
    magicForm.desc = desc ?? '';
    magicForm.name = name;
    magicForm.damage = Array.isArray(damage) ? damage[0] : damage ?? 0;
    magicForm.blast = blast ?? false;
  }

</script>
<InputDialog title={magicDialogTitle} scrollable={false} showDelete={magicDialogDelete} dice={[]} bind:this={magicDialog} form={magicForm} on:delete={removeMagic}>
  <form class="text-center flex flex-col gap-2">
    <Combobox options={builtin} selectedValue={selectedMagic} bind:textValue={magicForm.name} placeholder="Name" on:select={pickMagic} />
    <input type="text" name="desc" placeholder="Description" bind:value={magicForm.desc} bind:this={descField} class="rounded-full dark:bg-gray-900 dark:text-white focus:ring-purple-500 focus:border-purple-500">
    <div class="flex gap-4 items-center flex-wrap mt-4">
      <div class="flex gap-2 items-center">
        <DieSelector bind:current={magicForm.damage} nullable /> Damage 
      </div>
      {#if magicForm.damage !== 0}
      <div class="flex gap-2 items-center">
        <Toggle bind:value={magicForm.blast} /> Blast
      </div>
      {/if}
    </div>
    
  </form>
</InputDialog>