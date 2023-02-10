<script lang="ts">
  import InputDialog from "$lib/InputDialog.svelte";
  import Toggle from "$lib/Toggle.svelte";
  import DieSelector from "$lib/sheet/DieSelector.svelte";
  import type { DieValue, Item } from "$lib/types";
  import { id } from "$lib/rolling/id";

  export let equipment: Item[];

  interface ItemForm {
    id?: string;
    name: string;
    desc: string;
    bulky: boolean;
    damage: DieValue | 0;
    blast: boolean;
    enableMagic: boolean;
    armor: string;
  }

  function newItemForm(id?: string) {
    if (id) {
      const item = equipment.find(x => x.id === id);
      if (item != null) {
        return {
          ...item,
          damage: item.damage ?? 0,
          armor: item.armor ? item.armor.toString() : ''
        } as ItemForm;
      }
    }
    return {
      name: '',
      desc: '',
      damage: 0,
      blast: false,
      bulky: false,
      enableMagic: false,
      armor: '',
    } as ItemForm;
  }

  let itemDialog: InputDialog<ItemForm>;
  let itemDialogTitle = '';
  let itemDialogDelete = false;
  let itemForm: ItemForm = newItemForm();

  async function gearForm() {
    const item = await itemDialog.open();
    if (item != null) {
      const proper: Item = {
        id: item.id || id(),
        name: item.name,
        desc: item.desc,
        bulky: item.bulky,
        blast: item.blast,
        enableMagic: item.enableMagic
      }
      if (item.damage !== 0) {
        proper.damage = item.damage;
      }
      if (item.armor) {
        proper.armor = parseInt(item.armor, 10);
      }
      return proper;
    }
  }

  export async function addGear() {
    itemDialogTitle = 'Add item';
    itemDialogDelete = false;
    itemForm = newItemForm();
    const item = await gearForm();
    if (item != null) {
      equipment = [...equipment, item];
    }
  }

  export async function editGear(id: string) {
    itemDialogTitle = 'Edit item';
    itemDialogDelete = true;
    itemForm = newItemForm(id);
    const item = await gearForm();
    if (item != null) {
      const index = equipment.findIndex(x => x.id === id);
      if (index >= 0) {
        equipment = [...equipment.slice(0, index), item, ...equipment.slice(index + 1)];
      }
    }
  }

  function removeGear(ev: CustomEvent<ItemForm>) {
    const id = ev.detail.id;
    if (id) {
      equipment = equipment.filter(e => e.id !== id);
    }
  }


</script>
<InputDialog title={itemDialogTitle} showDelete={itemDialogDelete} dice={[]} bind:this={itemDialog} form={itemForm} on:delete={removeGear}>
  <form class="text-center flex flex-col gap-2">
    <input type="text" name="name" placeholder="Name" bind:value={itemForm.name} class="rounded-full dark:bg-gray-900 dark:text-white focus:ring-purple-500 focus:border-purple-500">
    <input type="text" name="desc" placeholder="Description" bind:value={itemForm.desc} class="rounded-full dark:bg-gray-900 dark:text-white focus:ring-purple-500 focus:border-purple-500">
    <div class="flex gap-4 items-center flex-wrap mt-4">
      <div class="flex gap-2 items-center">
        <Toggle bind:value={itemForm.bulky} /> Bulky 
      </div>
      <div class="flex gap-2 items-center">
        <Toggle bind:value={itemForm.enableMagic} /> Enable Magic 
      </div>
      <div class="flex gap-2 items-center">
        <input type="text" name="armor" size=5 inputmode="numeric" placeholder="Armor" bind:value={itemForm.armor} class="rounded-full dark:bg-gray-900 dark:text-white focus:ring-purple-500 focus:border-purple-500"> 
      </div>
      <div class="flex gap-2 items-center">
        <DieSelector bind:current={itemForm.damage} /> Damage 
      </div>
      {#if itemForm.damage !== 0}
      <div class="flex gap-2 items-center">
        <Toggle bind:value={itemForm.blast} /> Blast
      </div>
      {/if}
    </div>
  </form>
</InputDialog>