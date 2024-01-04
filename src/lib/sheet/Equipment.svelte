<script lang="ts">
  import { Die } from "$lib/dice";
  import IconButton from "$lib/IconButton.svelte";
  import DraggableList from "$lib/DraggableList.svelte";
  import type { Item } from "$lib/types";
  import { armor } from "$lib/util/character";
  import { onEnter } from "$lib/util/handlers";
  import { toggleHeight } from "$lib/util/toggle-height";
  import Card from "../Card.svelte";
  import EquipmentDialog from "./EquipmentDialog.svelte";
  import RollSelector from "./RollSelector.svelte";
  import Icon from "$lib/Icon.svelte";
  import InputDialog from "$lib/InputDialog.svelte";
  import { id } from "$lib/rolling/id";
  import { createEventDispatcher } from "svelte";
  export let equipment: Item[] = [];
  export let baseArmor: number | undefined = undefined;
  export let title = 'Equipment';
  export let hideArmor = false;
  export let selectable = false;
  export let isSharing = false;
  export let flat = false;
  export let allowFormula = false;
  let clazz = '';
  const instanceId = id();
  export { clazz as class };
  $: totalArmor = armor(equipment) + (baseArmor ?? 0);

  const getArmorForm = () => ({ armor: baseArmor?.toString() ?? '' });
  let baseArmorForm = getArmorForm();
  let baseArmorDialog: InputDialog<typeof baseArmorForm>;
  let dialog: EquipmentDialog;

  function addGear() {
    dialog.addGear();
  }

  function editGear(id: string) {
    dialog.editGear(id);
  }

  const dispatch = createEventDispatcher();
  function selectGear(item: Item) {
    if (!selectable || draggable) {
      editGear(item.id);
    } else {
      dispatch('select-item', item);
    }
  }

  function addQuantity(item: Item, amt: number) {
    item.quantity = Math.max(0, (item.quantity ?? 0) + amt);
    equipment = equipment;
  }
  let draggable = false;
  function transformDraggedElement(el?: HTMLElement) {
    el?.classList.add('!border-transparent');
  }
  async function setBaseArmor() {
    if (baseArmor == null) return;
    baseArmorForm = getArmorForm();
    const nf = await baseArmorDialog.open();
    if (nf) {
      baseArmor = parseInt(nf.armor, 10);
    }
  }
</script>
<Card class={clazz} inside={flat}>
  <EquipmentDialog bind:equipment bind:this={dialog} {allowFormula} />
  <InputDialog bind:this={baseArmorDialog} form={baseArmorForm}>
    <form class="flex gap-4 items-center">
      <label for="basearmor-{instanceId}">Base Armor</label>
      <input type="text" id="basearmor-{instanceId}" name="armor" size=5 inputmode="numeric" bind:value={baseArmorForm.armor} class="rounded-full dark:bg-gray-900 dark:text-white focus:ring-purple-500 focus:border-purple-500"> 
    </form>
  </InputDialog>
  <svelte:fragment slot="header">
    <div class="">
      <h3 class="text-xl font-subtitle leading-6">{title}</h3>
    </div>
    <div class="flex-shrink-0">
      <div class="flex gap-4 items-center">
        {#if equipment.length > 1 || selectable}
        <IconButton icon="edit-order" padding={draggable ? `p-1 !bg-emerald-300 dark:!bg-emerald-700` : `p-1`} on:click={() => draggable = !draggable} />
        {/if}
        {#if !hideArmor}
        <button class="relative {baseArmor == null ? 'cursor-default' : ''}" on:click={setBaseArmor}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" class="w-6"><path fill="currentColor" d="M256 0c4.6 0 9.2 1 13.4 2.9L457.7 82.8c22 9.3 38.4 31 38.3 57.2c-.5 99.2-41.3 280.7-213.7 363.2c-16.7 8-36.1 8-52.8 0C57.3 420.7 16.5 239.2 16 140c-.1-26.2 16.3-47.9 38.3-57.2L242.7 2.9C246.8 1 251.4 0 256 0z"/></svg>
          <div class="absolute w-full text-center text-lg top-1/2 -translate-y-1/2 leading-none text-white dark:text-gray-900">{totalArmor}</div>
        </button>
        {/if}
        <button type="button" on:click={addGear} class="relative inline-flex items-center rounded-full bg-purple-300 dark:bg-purple-700 p-1 font-medium shadow-sm hover:bg-purple-200 dark:hover:bg-purple-800 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-900"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" class="h-4 w-4"><path fill="currentColor" d="M256 80c0-17.7-14.3-32-32-32s-32 14.3-32 32V224H48c-17.7 0-32 14.3-32 32s14.3 32 32 32H192V432c0 17.7 14.3 32 32 32s32-14.3 32-32V288H400c17.7 0 32-14.3 32-32s-14.3-32-32-32H256V80z"/></svg></button>
      </div>
    </div>
  </svelte:fragment>
  <!-- body -->
  <div>
    <div class="flow-root">
      {#if equipment.length}
      <DraggableList {draggable} bind:list={equipment} class="{flat ? `-mt-5` : `-my-5`} divide-y divide-gray-200 dark:divide-gray-600" itemClass="py-3 relative !visible group" {transformDraggedElement} let:item>
        <div class="flex items-center gap-4 group-data-[is-dnd-shadow-item]:invisible group/item">
          <div class="min-w-0 flex-1 flex gap-2 items-center relative">
            {#if draggable}<Icon icon="grip-v" />{/if}
            <button type="button" class="truncate select-text text-sm font-medium cursor-pointer" title={item.name} on:click={() => selectGear(item)} on:keydown={onEnter(() => editGear(item.id))}>{item.name}</button>
            {#if isSharing}
            <div class="absolute right-0 hidden group-hover/item:block">
              <IconButton icon="share" on:click={() => dispatch('share', item)} />
            </div>
            {/if}
          </div>
          <div class="flex gap-2 items-center">
            {#if item.quantity != null}
            <div class="flex items-center gap-1">
              <IconButton icon="up" padding="p-1.5" on:click={() => addQuantity(item, 1)}/>
              <span class="inline-block min-w-[2rem] text-center">{item.quantity}</span>
              <IconButton icon="down" padding="p-1.5" on:click={() => addQuantity(item, -1)}/>
            </div>
            {/if}
            {#if allowFormula && item.quantFormula}
            <div class="font-medium text-sm">
              ({item.quantFormula})
            </div>
            {/if}
            {#if item.bulky}<span class="inline-flex items-center rounded-full dark:bg-purple-100 px-2.5 py-0.5 text-xs font-medium dark:text-purple-800 bg-purple-800 text-purple-100">Bulky</span>{/if}
            {#if item.damage}<RollSelector label={item.name} die={item.damage} direction={-1} on:roll let:events><button use:events type="button" class="inline-flex items-center text-sm font-medium leading-5"><Die which={item.damage}/></button></RollSelector>{/if}
          </div>
        </div>
        {#if item.desc}<p use:toggleHeight class="text-sm group-data-[is-dnd-shadow-item]:invisible text-gray-600 dark:text-gray-400">{item.desc}</p>{/if}
      </DraggableList>
      {:else}
      <div class="text-gray-600 dark:text-gray-400 h-full flex flex-col gap-2 items-center justify-center">
        <span class="italic">You got nothing.</span>
      </div>
    {/if}
    </div>
  </div>

</Card>