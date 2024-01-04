<script lang="ts">
  import IconButton from "$lib/IconButton.svelte";
  import DraggableList from "$lib/DraggableList.svelte";
  import { Die } from "$lib/dice";
  import type { Magic } from "$lib/types";
  import { onEnter } from "$lib/util/handlers";
  import { toggleHeight } from "$lib/util/toggle-height";
  import Card from "../Card.svelte";
  import MagicDialog from "./MagicDialog.svelte";
  import RollSelector from "./RollSelector.svelte";
  import Icon from "$lib/Icon.svelte";
  import { createEventDispatcher } from "svelte";
  type T = $$Generic<Magic>;
  export let magicList: T[];
  export let title: string;
  export let castable = false;
  export let isSharing = false;
  type TType = T["type"];
  export let type: TType;

  let dialog: MagicDialog<T>;
  
  const dispatch = createEventDispatcher();

  function addMagic() {
    dialog.addMagic();
  }

  function editMagic(id: string) {
    dialog.editMagic(id);
  }
  let draggable = false;
  function transformDraggedElement(el?: HTMLElement) {
    el?.classList.add('!border-transparent');
  }
</script>
<MagicDialog bind:magicList {type} bind:this={dialog} />
<Card class="md:h-[25rem] lg:order-2">
  <svelte:fragment slot="header">
    <div class="">
      <h3 class="text-xl font-subtitle leading-6">{title}</h3>
    </div>
    <div class="flex-shrink-0">
      <div class="flex gap-4 items-center">
        {#if magicList.length > 1}
        <IconButton icon="edit-order" padding={draggable ? `p-1 !bg-emerald-300 dark:!bg-emerald-700` : `p-1`} on:click={() => draggable = !draggable} />
        {/if}
        <button type="button" on:click={addMagic} class="relative inline-flex items-center rounded-full bg-purple-300 dark:bg-purple-700 p-1 font-medium shadow-sm hover:bg-purple-200 dark:hover:bg-purple-800 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-900"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" class="h-4 w-4"><path fill="currentColor" d="M256 80c0-17.7-14.3-32-32-32s-32 14.3-32 32V224H48c-17.7 0-32 14.3-32 32s14.3 32 32 32H192V432c0 17.7 14.3 32 32 32s32-14.3 32-32V288H400c17.7 0 32-14.3 32-32s-14.3-32-32-32H256V80z"/></svg></button>
      </div>
    </div>
  </svelte:fragment>
  <!-- body -->
  <div class="flow-root h-full">
    {#if magicList.length}
    <DraggableList {draggable} bind:list={magicList} class="-my-5 divide-y divide-gray-200 dark:divide-gray-600" itemClass="py-3 relative !visible group" {transformDraggedElement} let:item={arcana}>
      <div class="flex items-center gap-4 h-6 group/item group-data-[is-dnd-shadow-item]:invisible">
        <div class="min-w-0 flex-1 flex gap-4 relative items-center">
          {#if draggable}<Icon icon="grip-v" />{/if}
          <button type="button" class="truncate select-text text-sm font-medium cursor-pointer" title={arcana.name} on:click={() => editMagic(arcana.id)} on:keydown={onEnter(() => editMagic(arcana.id))}>{arcana.name}</button>
          {#if isSharing}
          <div class="absolute right-0 hidden group-hover/item:block">
            <IconButton icon="share" on:click={() => dispatch('share', arcana)} />
          </div>
          {/if}
        </div>
        <div class="flex gap-2 items-center">
          {#if arcana.damage}
          <RollSelector label={arcana.name} die={arcana.damage} direction={-1} on:roll let:events><button use:events type="button" class="inline-flex items-center text-sm font-medium leading-5"><Die which={arcana.damage}/></button></RollSelector>
          {:else if castable}
          <button on:click={() => dispatch('cast', {dice: [], name: arcana.name})} type="button" class="inline-flex items-center text-sm font-medium leading-5"><Icon icon="cast-magic" /></button>
          {/if}
        </div>
      </div>
      {#if arcana.desc}<p use:toggleHeight class="text-sm group-data-[is-dnd-shadow-item]:invisible text-gray-600 dark:text-gray-400">{arcana.desc}</p>{/if}
    </DraggableList>
    {:else}
      <div class="text-gray-600 dark:text-gray-400 h-full flex flex-col gap-2 items-center justify-center">
        <Icon icon="no-magic" size="2.5rem" />
        <span class="italic">No magic here.</span>
      </div>
    {/if}
  </div>

</Card>