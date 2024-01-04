<script lang="ts">
  import { dndzone, type DndEvent, SHADOW_ITEM_MARKER_PROPERTY_NAME, type TransformDraggedElementFunction } from 'svelte-dnd-action';
  import { flip } from 'svelte/animate';
  import type { Identifiable } from './types';
  type T = $$Generic<Identifiable>;
  export let draggable = true;
	export let list: T[];
  export let itemClass = '';
  export let transformDraggedElement: TransformDraggedElementFunction = () => {};
  let listClass = '';
  export { listClass as class };
  $: listInternal = list;
  const flipDurationMs = 200;

  function handleSort(ev: CustomEvent<DndEvent<T>>) {
    listInternal = ev.detail.items;
  }
  function finalize(ev: CustomEvent<DndEvent<T>>) {
    list = ev.detail.items;
  }
  function needShadow(item: T) {
    if (!$$slots.shadow) return false;
    if (SHADOW_ITEM_MARKER_PROPERTY_NAME in item) {
      return item[SHADOW_ITEM_MARKER_PROPERTY_NAME] as boolean;
    }
    return false;
  }
</script>
<ul class={listClass} use:dndzone={{ items: listInternal, flipDurationMs, dragDisabled: !draggable, dropTargetStyle: {}, transformDraggedElement }} on:consider={handleSort} on:finalize={finalize}>
  {#each listInternal as item (item.id)}
    <li class={itemClass} animate:flip={{ duration: flipDurationMs }}>
      <slot {item}></slot>
      {#if needShadow(item)}
        <slot name="shadow"></slot>
      {/if}
    </li>
  {/each}
</ul>