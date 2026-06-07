<script lang="ts">
  import {
    dndzone,
    type DndEvent,
    SHADOW_ITEM_MARKER_PROPERTY_NAME,
    type TransformDraggedElementFunction,
  } from 'svelte-dnd-action';
  import { flip } from 'svelte/animate';
  import type { Identifiable } from './types';
  type T = $$Generic<Identifiable>;
  interface Props {
    draggable?: boolean;
    list: T[];
    itemClass?: string;
    transformDraggedElement?: TransformDraggedElementFunction;
    class?: string;
    shadow?: import('svelte').Snippet;
    children?: import('svelte').Snippet<[{ item: T }]>;
  }

  let {
    draggable = true,
    list = $bindable(),
    itemClass = '',
    transformDraggedElement = () => {},
    class: listClass = '',
    shadow,
    children,
  }: Props = $props();

  let listInternal: T[] = $state(list);

  const flipDurationMs = 200;

  function handleSort(ev: CustomEvent<DndEvent<T>>) {
    listInternal = ev.detail.items;
  }
  function finalize(ev: CustomEvent<DndEvent<T>>) {
    list = ev.detail.items;
  }
  function needShadow(item: T) {
    if (!shadow) return false;
    if (SHADOW_ITEM_MARKER_PROPERTY_NAME in item) {
      return item[SHADOW_ITEM_MARKER_PROPERTY_NAME] as boolean;
    }
    return false;
  }
</script>

<ul
  class={listClass}
  use:dndzone={{
    items: listInternal,
    flipDurationMs,
    dragDisabled: !draggable,
    dropTargetStyle: {},
    transformDraggedElement,
  }}
  onconsider={handleSort}
  onfinalize={finalize}
>
  {#each listInternal as item (item.id)}
    <li class={itemClass} animate:flip={{ duration: flipDurationMs }}>
      {@render children?.({ item })}
      {#if needShadow(item)}
        {@render shadow?.()}
      {/if}
    </li>
  {/each}
</ul>
