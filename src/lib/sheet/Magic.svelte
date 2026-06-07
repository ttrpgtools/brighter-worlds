<script lang="ts">
  import Button from '$lib/ui/button.svelte';
  import DraggableList from '$lib/DraggableList.svelte';
  import { Die } from '$lib/dice';
  import type { DieRollSet, Magic } from '$lib/types';
  import { onEnter } from '$lib/util/handlers';
  import { toggleHeight } from '$lib/util/toggle-height';
  import Card from '../ui/card.svelte';
  import MagicDialog from './MagicDialog.svelte';
  import RollSelector from './RollSelector.svelte';
  import Icon from '$lib/ui/icon.svelte';
  type T = $$Generic<Magic>;
  type TType = T['type'];
  interface Props {
    magicList?: T[];
    title: string;
    castable?: boolean;
    isSharing?: boolean;
    onroll: (data: { dice: DieRollSet; name: string }) => void;
    onshare: (data: Magic) => void;
    oncast?: (data: { dice: DieRollSet; name: string }) => void;
    type: TType;
  }

  let {
    magicList = $bindable([]),
    title,
    castable = false,
    isSharing = false,
    onroll,
    oncast,
    onshare,
    type,
  }: Props = $props();

  let dialog: MagicDialog<T> | undefined = $state();

  function addMagic() {
    dialog?.addMagic();
  }

  function editMagic(id: string) {
    dialog?.editMagic(id);
  }
  let draggable = $state(false);
  function transformDraggedElement(el?: HTMLElement) {
    el?.classList.add('!border-transparent');
  }
</script>

<MagicDialog bind:magicList {type} bind:this={dialog} />
<Card class="md:h-[25rem] lg:order-2">
  {#snippet header()}
    <div class="">
      <h3 class="text-xl font-subtitle leading-6">{title}</h3>
    </div>
    <div class="flex-shrink-0">
      <div class="flex gap-4 items-center">
        {#if magicList.length > 1}
          <Button
            size="icon"
            icon="edit-order"
            class={draggable ? `p-1 !bg-emerald-300 dark:!bg-emerald-700` : `p-1`}
            onclick={() => (draggable = !draggable)}
          />
        {/if}
        <Button class="border-0" icon="plus" size="tight" iconClass="size-4" onclick={addMagic} />
      </div>
    </div>
  {/snippet}
  <!-- body -->
  <div class="flow-root h-full">
    {#if magicList.length}
      <DraggableList
        {draggable}
        bind:list={magicList}
        class="-my-5 divide-y divide-gray-200 dark:divide-gray-600"
        itemClass="py-3 relative !visible group"
        {transformDraggedElement}
      >
        {#snippet children({ item: arcana })}
          <div
            class="flex items-center gap-4 h-6 group/item group-data-[is-dnd-shadow-item]:invisible"
          >
            <div class="min-w-0 flex-1 flex gap-4 relative items-center">
              {#if draggable}<Icon icon="grip-v" />{/if}
              <button
                type="button"
                class="truncate select-text text-sm font-medium cursor-pointer"
                title={arcana.name}
                onclick={() => editMagic(arcana.id)}
                onkeydown={onEnter(() => editMagic(arcana.id))}>{arcana.name}</button
              >
              {#if isSharing}
                <div class="absolute right-0 hidden group-hover/item:block">
                  <Button size="icon" icon="share" onclick={() => onshare(arcana)} />
                </div>
              {/if}
            </div>
            <div class="flex gap-2 items-center">
              {#if arcana.damage}
                <RollSelector label={arcana.name} die={arcana.damage} direction={-1} {onroll}
                  >{#snippet children({ events, damage })}
                    <button
                      use:events
                      type="button"
                      class="inline-flex items-center text-sm font-medium leading-5"
                      ><Die which={damage} /></button
                    >
                  {/snippet}
                </RollSelector>
              {:else if castable}
                <button
                  onclick={() => oncast?.({ dice: [], name: arcana.name })}
                  type="button"
                  class="inline-flex items-center text-sm font-medium leading-5"
                  ><Icon icon="cast-magic" /></button
                >
              {/if}
            </div>
          </div>
          {#if arcana.desc}<p
              use:toggleHeight
              class="text-sm group-data-[is-dnd-shadow-item]:invisible text-gray-600 dark:text-gray-400"
            >
              {arcana.desc}
            </p>{/if}
        {/snippet}
      </DraggableList>
    {:else}
      <div
        class="text-gray-600 dark:text-gray-400 h-full flex flex-col gap-2 items-center justify-center"
      >
        <Icon icon="no-magic" class="size-10" />
        <span class="italic">No magic here.</span>
      </div>
    {/if}
  </div>
</Card>
