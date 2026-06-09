<script lang="ts">
  import { isElement } from './util/validate';
  import Button from './ui/button.svelte';
  import DeleteButton from './DeleteButton.svelte';
  import DialogBase from './DialogBase.svelte';
  import { Die } from './dice';
  import type { DieValue } from './types';
  import { focusFirst } from './util/focus';
  import { onEnter } from './util/handlers';
  type T = $$Generic;
  interface Props {
    dice?: DieValue[];
    title?: string;
    scrollable?: boolean;
    showDelete?: boolean;
    form: T;
    okBtnLabel?: string;
    okBtnAction?: () => void;
    valid?: boolean;
    ondelete?: (form: T) => void;
    children?: import('svelte').Snippet;
  }

  let {
    dice = [],
    title = '',
    scrollable = true,
    showDelete = false,
    form,
    okBtnLabel = 'OK',
    okBtnAction = () => close(form),
    valid = true,
    ondelete,
    children,
  }: Props = $props();
  let comp: DialogBase<T> | undefined = $state();

  export async function open() {
    return comp?.open<T>();
  }

  export function close(value?: T) {
    comp?.close(value);
  }

  function handleKeys(ev: KeyboardEvent) {
    if (isElement(ev.target) && ev.target.tagName.toUpperCase() === 'TEXTAREA') {
      return;
    }
    ev.preventDefault();
    okBtnAction();
  }

  function handleDelete() {
    ondelete?.(form);
    comp?.close();
  }
</script>

<DialogBase {title} bind:this={comp} {scrollable}>
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
    </div>
  {/snippet}
  <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
  <div role="dialog" tabindex="-1" class="mt-5" use:focusFirst onkeydown={onEnter(handleKeys)}>
    {@render children?.()}
  </div>
  {#snippet footer()}
    <div class="mt-5 text-center flex gap-2 justify-start">
      <Button disabled={!valid} onclick={okBtnAction}>{okBtnLabel}</Button>
      <Button variant="ghost" onclick={() => close()}>Cancel</Button>
      {#if showDelete}
        <div class="grow"></div>
        <DeleteButton onconfirm={handleDelete}></DeleteButton>
      {/if}
    </div>
  {/snippet}
</DialogBase>
