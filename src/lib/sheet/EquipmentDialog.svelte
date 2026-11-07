<script lang="ts">
  import InputDialog from '$lib/InputDialog.svelte';
  import Toggle from '$lib/ui/toggle.svelte';
  import DieSelector from '$lib/sheet/DieSelector.svelte';
  import type { DieValue, Item } from '$lib/types';
  import { id } from '$lib/rolling/id';
  import { append, remove, update } from '$lib/util/array';
  import { isNumeric, isRollFormula } from '$lib/util/validate';
  import { isGmContext } from '$lib/util/gm';
  import Button from '$lib/ui/button.svelte';
  import {
    cloneEditorDraft,
    isOptionalImage,
    isSupportedRollFormula,
  } from '$lib/util/gm-editor-validation';

  interface Props {
    equipment: Item[];
    allowFormula?: boolean;
    actionLabels?: boolean;
    allowDelete?: boolean;
  }

  let {
    equipment = $bindable(),
    allowFormula = false,
    actionLabels = false,
    allowDelete = true,
  }: Props = $props();

  const isGm = isGmContext();

  interface ItemForm {
    original?: Item;
    magic?: Item['magic'];
    id?: string;
    name: string;
    desc: string;
    image: string | Blob;
    bulky: boolean;
    depleted: boolean;
    unequiped: boolean;
    damage: DieValue | DieValue[] | 0;
    blast: boolean;
    enableMagic: boolean;
    armor: string;
    quantity: string;
  }

  function newItemForm(id?: string) {
    if (id) {
      const item = equipment.find((x) => x.id === id);
      if (item != null) {
        return {
          ...cloneEditorDraft(item),
          original: cloneEditorDraft(item),
          image: cloneEditorDraft(item.image ?? ''),
          desc: item.desc ?? '',
          damage: cloneEditorDraft(item.damage ?? 0),
          armor: item.armor ? item.armor.toString() : '',
          depleted: item.depleted ?? false,
          unequiped: item.unequiped ?? false,
          quantity: item.quantFormula
            ? item.quantFormula
            : item.quantity != null
              ? item.quantity.toString()
              : '',
        } as ItemForm;
      }
    }
    return {
      name: '',
      desc: '',
      image: '',
      damage: 0,
      blast: false,
      bulky: false,
      depleted: false,
      unequiped: false,
      enableMagic: false,
      armor: '',
      quantity: '',
    } as ItemForm;
  }

  let itemDialog: InputDialog<ItemForm> | undefined = $state();
  let itemDialogTitle = $state('');
  let itemDialogDelete = $state(false);
  let itemForm: ItemForm = $state(newItemForm());
  let dirty: Record<string, boolean> = $state({});

  let errors = $derived({
    name: itemForm.name.trim() ? '' : 'Enter a name.',
    armor:
      !itemForm.armor.trim() ||
      (/^\d+$/.test(itemForm.armor.trim()) && Number.isSafeInteger(Number(itemForm.armor)))
        ? ''
        : 'Armor must be a non-negative integer.',
    quantity:
      !itemForm.quantity.trim() ||
      (/^\d+$/.test(itemForm.quantity.trim()) && Number.isSafeInteger(Number(itemForm.quantity))) ||
      (allowFormula && isSupportedRollFormula(itemForm.quantity))
        ? ''
        : allowFormula
          ? 'Use a non-negative integer or supported dice formula for quantity.'
          : 'Quantity must be a non-negative integer.',
    image: isOptionalImage(itemForm.image) ? '' : 'Use an image URL or relative image path.',
    damage: (Array.isArray(itemForm.damage) ? itemForm.damage : [itemForm.damage]).every((die) =>
      [0, 4, 6, 8, 10, 12].includes(die),
    )
      ? ''
      : 'Choose a supported damage die.',
  });
  let valid = $derived(!isGm || !Object.values(errors).some(Boolean));

  async function gearForm() {
    const item = await itemDialog?.open();
    if (item != null) {
      const proper: Item = {
        ...item.original,
        id: item.id || id(),
        name: isGm ? item.name.trim() : item.name,
        desc: item.desc,
        bulky: item.bulky,
        blast: item.blast,
        depleted: item.depleted,
        unequiped: item.unequiped,
        ...(item.magic ? { magic: item.magic } : {}),
      };
      delete proper.damage;
      delete proper.armor;
      delete proper.quantity;
      delete proper.quantFormula;
      delete proper.image;
      if (item.damage !== 0) {
        proper.damage = item.damage;
      }
      if (item.armor) {
        proper.armor = parseInt(item.armor, 10);
      }
      if (item.image) {
        proper.image = item.image;
      }
      if (item.quantity) {
        if (isNumeric(item.quantity.trim())) {
          const quant = parseInt(item.quantity.trim(), 10);
          if (quant >= 0) {
            proper.quantity = quant;
          }
        } else if (allowFormula && isRollFormula(item.quantity.trim())) {
          proper.quantFormula = item.quantity.trim();
        }
      }
      return cloneEditorDraft(proper);
    }
  }

  export async function addGear() {
    dirty = {};
    itemDialogTitle = isGm ? 'New Item' : 'Add item';
    itemDialogDelete = false;
    itemForm = newItemForm();
    const item = await gearForm();
    if (item != null) {
      equipment = append(equipment, item);
    }
  }

  export async function editGear(id: string) {
    dirty = {};
    itemDialogTitle = isGm ? 'Edit Item' : 'Edit item';
    itemDialogDelete = true;
    itemForm = newItemForm(id);
    const item = await gearForm();
    if (item != null) {
      equipment = update(equipment, item);
    }
  }

  function removeGear(form: ItemForm) {
    const id = form.id;
    if (id) {
      equipment = remove(equipment, id);
    }
  }
</script>

<InputDialog
  title={itemDialogTitle}
  {valid}
  okBtnLabel={isGm || actionLabels ? (itemDialogDelete ? 'Save changes' : 'Create') : 'OK'}
  showDelete={allowDelete && itemDialogDelete}
  dice={[]}
  bind:this={itemDialog}
  form={itemForm}
  ondelete={removeGear}
>
  <div class="text-left flex flex-col gap-2">
    <label for="equipment-name">Name</label>
    <input
      type="text"
      data-1p-ignore
      id="equipment-name"
      name="name"
      aria-invalid={isGm && !!dirty.name && !!errors.name}
      placeholder="Name"
      bind:value={itemForm.name}
      oninput={() => (dirty.name = true)}
      class="rounded-full dark:bg-gray-900 dark:text-white focus:ring-purple-500 focus:border-purple-500"
    />
    {#if isGm && dirty.name && errors.name}<p class="text-sm text-red-700 dark:text-red-300">
        {errors.name}
      </p>{/if}
    <label for="equipment-desc">Description</label>
    <input
      id="equipment-desc"
      type="text"
      name="desc"
      placeholder="Description"
      bind:value={itemForm.desc}
      class="rounded-full dark:bg-gray-900 dark:text-white focus:ring-purple-500 focus:border-purple-500"
    />
    {#if isGm && typeof itemForm.image === 'string'}<label for="equipment-image"
        >Image URL (optional)</label
      ><input
        id="equipment-image"
        aria-invalid={!!dirty.image && !!errors.image}
        type="text"
        name="image"
        placeholder="Image URL"
        bind:value={itemForm.image}
        oninput={() => (dirty.image = true)}
        class="rounded-full dark:bg-gray-900 dark:text-white focus:ring-purple-500 focus:border-purple-500"
      />
      {#if dirty.image && errors.image}<p class="text-sm text-red-700 dark:text-red-300">
          {errors.image}
        </p>{/if}
    {:else if isGm}<div class="flex items-center gap-2">
        <span>Saved image</span><Button
          size="sm"
          variant="ghost"
          onclick={() => {
            dirty.image = true;
            itemForm.image = '';
          }}>Remove image</Button
        >
      </div>{/if}
    <div class="flex gap-4 items-center flex-wrap mt-4">
      <div class="flex gap-2 items-center">
        <Toggle bind:value={itemForm.bulky} /> Bulky
      </div>
      <div class="flex gap-2 items-center">
        <Toggle bind:value={itemForm.depleted} /> Depleted
      </div>
      {#if Number(itemForm.armor) > 0}
        <div class="flex gap-2 items-center">
          <Toggle
            bind:value={() => !itemForm.unequiped, (active) => (itemForm.unequiped = !active)}
          /> Armor active
        </div>
      {/if}
      <!-- <div class="flex gap-2 items-center">
        <Toggle bind:value={itemForm.enableMagic} /> Enable Magic 
      </div> -->
      <div class="flex gap-2 items-center">
        <input
          type="text"
          aria-label="Armor"
          aria-invalid={isGm && !!dirty.armor && !!errors.armor}
          name="armor"
          size="5"
          inputmode="numeric"
          placeholder="Armor"
          bind:value={itemForm.armor}
          oninput={() => (dirty.armor = true)}
          class="rounded-full dark:bg-gray-900 dark:text-white focus:ring-purple-500 focus:border-purple-500"
        />
      </div>
      <div class="flex gap-2 items-center">
        <input
          type="text"
          aria-label="Quantity"
          aria-invalid={isGm && !!dirty.quantity && !!errors.quantity}
          name="quantity"
          size="5"
          inputmode="numeric"
          placeholder="Qty"
          bind:value={itemForm.quantity}
          oninput={() => (dirty.quantity = true)}
          class="rounded-full dark:bg-gray-900 dark:text-white focus:ring-purple-500 focus:border-purple-500"
        />
      </div>
      <div class="flex gap-2 items-center">
        {#if Array.isArray(itemForm.damage)}
          <span>Damage: {itemForm.damage.map((die) => `d${die}`).join(' + ')}</span>
          <Button
            size="sm"
            variant="ghost"
            onclick={() => {
              dirty.damage = true;
              itemForm.damage = 0;
            }}>Replace damage</Button
          >
        {:else}<DieSelector
            bind:current={itemForm.damage}
            nullable
            invalid={isGm && !!dirty.damage && !!errors.damage}
            onchange={() => (dirty.damage = true)}
          /> Damage{/if}
      </div>
      {#if itemForm.damage !== 0}
        <div class="flex gap-2 items-center">
          <Toggle bind:value={itemForm.blast} /> Blast
        </div>
      {/if}
    </div>
    {#if isGm}
      {#each ['armor', 'quantity', 'damage'] as field (field)}
        {@const error = errors[field as 'armor' | 'quantity' | 'damage']}
        {#if dirty[field] && error}<p class="text-sm text-red-700 dark:text-red-300">
            {error}
          </p>{/if}
      {/each}
    {/if}
  </div>
</InputDialog>
