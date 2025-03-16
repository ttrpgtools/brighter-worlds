<script lang="ts">
  import { getEnhanced, getImpaired, getModifiedDice } from '$lib/rolling/modifier';
  import type { DieRollSet, DieValue } from '$lib/types';
  import { add } from '$lib/util/hold';
  import { fly } from 'svelte/transition';
  import { createPopover } from 'svelte-headlessui';
  import { onClickOutside } from '$lib/util/on-click-outside';
  import { getSettings } from '$lib/data/settings';
  import { cn, type ClassNameValue } from '$lib/util/tw';
  import type { Action } from 'svelte/action';

  const popover = createPopover({ label: 'Modifiers' });
  const setupCloser = onClickOutside(() => popover.close(), true);

  interface Props {
    label: string;
    die: DieValue | DieValue[];
    direction?: -1 | 1;
    posCls?: ClassNameValue;
    class?: ClassNameValue;
    onroll: (data: { dice: DieRollSet; name: string }) => void;
    children: import('svelte').Snippet<
      [
        {
          events: Action;
          damage: DieValue | DieValue[];
          cprops: {
            onclick: (ev: MouseEvent) => void;
            oncontextmenu: (ev: Event) => void;
          };
        }
      ]
    >;
  }

  let {
    label,
    die,
    direction = 1,
    posCls = '',
    class: klass = '',
    onroll,
    children
  }: Props = $props();

  const settings = getSettings();

  function roll(pev: MouseEvent) {
    //const pev = ev.detail;
    popover.close();
    const dice = getModifiedDice(pev, die as DieValue);
    onroll({ dice, name: label });
  }
  function rollEnhance() {
    const dice = getEnhanced(die);
    popover.close();
    onroll({ dice, name: label });
  }
  function rollImpair() {
    const dice = getImpaired();
    popover.close();
    onroll({ dice, name: label });
  }
  function showSelector(ev: Event) {
    ev.preventDefault();
    popover.open();
  }
  function handleClick(ev: MouseEvent) {
    if (ev.button === 2 && !$popover.expanded) {
      popover.open();
    } else if (
      $settings.desktopMode ||
      $popover.expanded ||
      ev.altKey ||
      ev.ctrlKey ||
      ev.shiftKey ||
      ev.metaKey
    ) {
      roll(ev);
      ev.preventDefault();
    } else {
      popover.open();
    }
  }
  const cprops = { onclick: handleClick, oncontextmenu: showSelector };
  function events(node: HTMLElement) {
    //const holdAction = hold(node);
    //const removeTap = add(node, 'tap', roll);
    //const removeHold = add(node, 'hold', () => popover.open());
    const removeClick = add(node, 'click', handleClick);
    const removeContext = add(node, 'contextmenu', showSelector);
    return {
      destroy() {
        //removeTap();
        //removeHold();
        removeClick();
        removeContext();
        //holdAction.destroy();
      }
    };
  }
  function manageCloser(node: HTMLElement) {
    let removeFn: (() => void) | undefined;
    popover.subscribe(({ expanded }) => {
      if (expanded) {
        removeFn = setupCloser(node);
      } else if (removeFn != null) {
        removeFn();
        removeFn = undefined;
      }
    });
  }
</script>

<div class={cn(['flex', klass])}>
  <div class="relative" use:manageCloser>
    {#if $popover.expanded}
      <div
        class={cn([
          'absolute z-10 flex gap-2 top-1/2 -translate-y-1/2',
          direction === 1
            ? posCls || `left-full translate-x-2`
            : posCls || `right-full -translate-x-2`,
          direction === 1 ? 'flex-row' : 'flex-row-reverse'
        ])}
      >
        <button
          aria-label="+"
          type="button"
          transition:fly={{ x: direction * -30 }}
          onclick={rollEnhance}
          class="bg-emerald-500 text-white rounded-full p-2 flex items-center justify-center"
          ><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" class="h-6 w-6"
            ><path
              fill="currentColor"
              d="M240 80c0-17.7-14.3-32-32-32s-32 14.3-32 32V224H32c-17.7 0-32 14.3-32 32s14.3 32 32 32H176V432c0 17.7 14.3 32 32 32s32-14.3 32-32V288H384c17.7 0 32-14.3 32-32s-14.3-32-32-32H240V80z"
            /></svg
          ></button
        >
        <button
          aria-label="-"
          type="button"
          transition:fly={{ x: direction * -30, delay: 70 }}
          onclick={rollImpair}
          class="bg-rose-500 text-white rounded-full p-2 flex items-center justify-center"
          ><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" class="h-6 w-6"
            ><path
              fill="currentColor"
              d="M416 256c0 17.7-14.3 32-32 32L32 288c-17.7 0-32-14.3-32-32s14.3-32 32-32l352 0c17.7 0 32 14.3 32 32z"
            /></svg
          ></button
        >
      </div>
    {/if}
    {@render children?.({ events, damage: die, cprops })}
  </div>
</div>
