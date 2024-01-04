<script lang="ts">
  import { isElement } from "./util/validate";

  import { createEventDispatcher } from "svelte";
  import Button from "./Button.svelte";
  import DeleteButton from "./DeleteButton.svelte";
  import DialogBase from "./DialogBase.svelte";
  import { Die } from "./dice";
  import type { DieValue } from "./types";
  import { focusFirst } from "./util/focus";
  import { onEnter } from "./util/handlers";
  export let dice: DieValue[] = [];
  export let title = '';
  export let scrollable = true;
  export let showDelete = false;
  type T = $$Generic;
  export let form: T;
  export let okBtnLabel = 'OK';
  export let okBtnAction = () => close(form);
  export let valid = true;
  let comp: DialogBase<T>;

  const dispatch = createEventDispatcher();

  export async function open() {
    return comp.open<T>();
  }

  export function close(value?: T) {
    comp.close(value);
  }

  function handleKeys(ev: KeyboardEvent) {
    if (isElement(ev.target) && ev.target.tagName.toUpperCase() === 'TEXTAREA') { return; }
    ev.preventDefault();
    okBtnAction();
  }

  function handleDelete() {
    dispatch('delete', form);
    comp.close();
  }
</script>
<DialogBase {title} bind:this={comp} {scrollable}>
  <div slot="pretitle">
    {#if dice.length > 0}
    <div class="flex gap-4 justify-center items-center mb-3 sm:mb-5">
      {#each dice as die}
      <div class="flex h-12 w-12 items-center justify-center rounded-full bg-gray-200 dark:bg-gray-700">
        <Die which={die} />
      </div>
      {/each}
    </div>
    {/if}
  </div>
  <!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
  <div role="dialog" class="mt-5" use:focusFirst on:keydown={onEnter(handleKeys)}>
    <slot></slot>
  </div>
  <div class="mt-5 text-center flex gap-2 justify-start" slot="footer">
    <Button disabled={!valid} on:click={okBtnAction}>{okBtnLabel}</Button>
    <Button plain on:click={() => close()}>Cancel</Button>
    {#if showDelete}
      <div class="flex-grow"></div>
      <DeleteButton on:confirm={handleDelete}></DeleteButton>
    {/if}
  </div>
</DialogBase>