<script lang="ts">
  import { getEnhanced, getImpaired, getModifiedDice } from '$lib/rolling/modifier';
  import type { DieRollSet, DieValue } from '$lib/types';
  import { fly } from 'svelte/transition';
  import { getSettings } from '$lib/data/settings';
  import { cn, type ClassNameValue } from '$lib/util/tw';

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
          damage: DieValue | DieValue[];
          cprops: {
            onclick: (ev: MouseEvent) => void;
            oncontextmenu: (ev: Event) => void;
          };
        },
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
    children,
  }: Props = $props();

  const settings = getSettings();
  let popoverOpen = $state(false);
  let selectorOpen = false;

  function setSelectorOpen(open: boolean) {
    selectorOpen = open;
    popoverOpen = open;
  }

  function roll(pev: MouseEvent) {
    //const pev = ev.detail;
    pev.stopPropagation();
    setSelectorOpen(false);
    const dice = getModifiedDice(pev, die as DieValue);
    onroll({ dice, name: label });
  }
  function rollEnhance(ev?: MouseEvent) {
    ev?.stopPropagation();
    const dice = getEnhanced(die);
    setSelectorOpen(false);
    onroll({ dice, name: label });
  }
  function rollImpair(ev?: MouseEvent) {
    ev?.stopPropagation();
    const dice = getImpaired();
    setSelectorOpen(false);
    onroll({ dice, name: label });
  }
  function showSelector(ev: Event) {
    ev.preventDefault();
    ev.stopPropagation();
    setSelectorOpen(true);
  }
  function handleClick(ev: MouseEvent) {
    ev.stopPropagation();
    if (ev.button === 2 && !selectorOpen) {
      setSelectorOpen(true);
    } else if (
      $settings.desktopMode ||
      selectorOpen ||
      ev.altKey ||
      ev.ctrlKey ||
      ev.shiftKey ||
      ev.metaKey
    ) {
      roll(ev);
      ev.preventDefault();
    } else {
      setSelectorOpen(true);
    }
  }
  function closeSelector() {
    if (!selectorOpen) return;
    setSelectorOpen(false);
  }
  const cprops = { onclick: handleClick, oncontextmenu: showSelector };

  function closeOnOutsideClick(node: HTMLElement) {
    function close(ev: Event) {
      if (!selectorOpen) return;
      if (ev.target instanceof Node && node.contains(ev.target)) return;
      closeSelector();
    }

    document.addEventListener('pointerdown', close, true);
    document.addEventListener('contextmenu', close, true);

    return () => {
      document.removeEventListener('pointerdown', close, true);
      document.removeEventListener('contextmenu', close, true);
    };
  }
</script>

<div class={cn(['flex', klass])}>
  <div class="relative" {@attach closeOnOutsideClick}>
    {#if popoverOpen}
      <div
        class={cn([
          'absolute top-1/2 z-10 flex -translate-y-1/2 gap-2',
          direction === 1 ? 'left-full ml-2 flex-row' : 'right-full mr-2 flex-row-reverse',
          posCls,
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
    {@render children?.({ damage: die, cprops })}
  </div>
</div>
