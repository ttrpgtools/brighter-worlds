<script lang="ts">
  import { getEnhanced, getImpaired, getModifiedDice } from "$lib/rolling/modifier";
  import type { DieValue } from "$lib/types";
  import { createEventDispatcher } from "svelte";
  import { hold, add } from "$lib/util/hold";
  import { fly } from 'svelte/transition';
  import { createPopover } from 'svelte-headlessui';
  import { onClickOutside } from "$lib/util/on-click-outside";

  const dispatch = createEventDispatcher();
  const popover = createPopover({label: 'Modifiers'});
  const setupCloser = onClickOutside(() => popover.close(), true);

  export let label: string;
  export let die: DieValue;
  export let direction: -1 | 1 = 1;
  export let posCls = '';

  function roll(pev: MouseEvent) {
    //const pev = ev.detail;
    console.log('TAP');
    popover.close();
    const dice = getModifiedDice(pev, die as DieValue);
    dispatch('roll', { dice, name: label });
  }
  function rollEnhance() {
    const dice = getEnhanced(die);
    popover.close();
    dispatch('roll', { dice, name: label });
  }
  function rollImpair() {
    const dice = getImpaired();
    popover.close();
    dispatch('roll', { dice, name: label });
  }
  function stopMobileMenu(ev: Event) {
    //if ('pointerType' in ev && ev.pointerType === 'touch') {
      ev.preventDefault();
    //}
  }
  function events(node: HTMLElement) {
    //const holdAction = hold(node);
    //const removeTap = add(node, 'tap', roll);
    //const removeHold = add(node, 'hold', () => popover.open());
    const removeClick = add(node, 'click', ev => {
      if ($popover.expanded) {
        roll(ev);
      } else {
        popover.open();
      }
    });
    //const removeContext = add(node, 'contextmenu', stopMobileMenu);
    return {
      destroy() {
        //removeTap();
        //removeHold();
        removeClick();
        //removeContext();
        //holdAction.destroy();
      }
    }
  }
  function manageCloser(node: HTMLElement) {
    let removeFn: (() => void) | undefined;
    popover.subscribe(({expanded}) => {
      if (expanded) {
        removeFn = setupCloser(node);
      } else if (removeFn != null) {
        removeFn();
        removeFn = undefined;
      }
    });
  }
</script>
<div class="flex">
  <div class="relative" use:manageCloser>
    {#if $popover.expanded}
    <div class="absolute z-10 {direction === 1 ? (posCls || `left-full translate-x-2`) : (posCls || `right-full -translate-x-2`)} flex gap-2 top-1/2 -translate-y-1/2 {direction === 1 ? 'flex-row' : 'flex-row-reverse'}">
      <button type="button" transition:fly={{x: direction * -30}} on:click={rollEnhance} class="bg-emerald-500 text-white rounded-full p-2 flex items-center justify-center"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" class="h-6 w-6"><path fill="currentColor" d="M240 80c0-17.7-14.3-32-32-32s-32 14.3-32 32V224H32c-17.7 0-32 14.3-32 32s14.3 32 32 32H176V432c0 17.7 14.3 32 32 32s32-14.3 32-32V288H384c17.7 0 32-14.3 32-32s-14.3-32-32-32H240V80z"/></svg></button>
      <button type="button" transition:fly={{x: direction * -30, delay: 70}} on:click={rollImpair} class="bg-rose-500 text-white rounded-full p-2 flex items-center justify-center"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" class="h-6 w-6"><path fill="currentColor" d="M416 256c0 17.7-14.3 32-32 32L32 288c-17.7 0-32-14.3-32-32s14.3-32 32-32l352 0c17.7 0 32 14.3 32 32z"/></svg></button>
    </div>
    {/if}
    <slot {events}></slot>
  </div>
</div>
