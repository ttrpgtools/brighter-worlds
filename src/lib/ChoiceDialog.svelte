<script lang="ts">
  import Button from './ui/button.svelte';
  import DialogBase from './DialogBase.svelte';
  import { Die } from './dice';
  import type { DieValue } from './types';
  type T = $$Generic;
  interface Props {
    dice?: DieValue[];
    title?: string;
    msg?: string;
    titleClass?: string;
    msgClass?: string;
    choices: { value: T; label: string }[];
  }

  let {
    dice = [],
    title = '',
    msg = '',
    titleClass = '',
    msgClass = '',
    choices
  }: Props = $props();
  let comp: DialogBase<T> | undefined = $state();
  export async function open() {
    return comp?.open<T>();
  }
  function close(value: T) {
    comp?.close(value);
  }
</script>

<DialogBase bind:this={comp}>
  {#snippet pretitle()}
    <div>
      {#if dice.length > 0}
        <div class="flex gap-4 justify-center items-center mb-3 sm:mb-5">
          {#each dice as die}
            <div
              class="flex h-12 w-12 items-center justify-center rounded-full bg-gray-200 dark:bg-gray-700"
            >
              <Die which={die} />
            </div>
          {/each}
        </div>
      {/if}
      <h3 class="text-xl font-medium leading-6 text-center {titleClass}">{title}</h3>
    </div>
  {/snippet}
  {#if !!msg}
    <div class="mt-2">
      <p class="text-center {msgClass}">
        {msg}
      </p>
    </div>
  {/if}
  {#snippet footer()}
    <div class="mt-5 sm:mt-6 flex gap-4 justify-center">
      {#each choices as choice}
        <Button onclick={() => close(choice.value)}>{choice.label}</Button>
      {/each}
    </div>
  {/snippet}
</DialogBase>
