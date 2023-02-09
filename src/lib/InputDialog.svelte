<script lang="ts">
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
export let showDelete = false;
type T = $$Generic;
export let form: T;
let comp: DialogBase<T>;

const dispatch = createEventDispatcher();

export async function open() {
  return comp.open<T>();
}

function handleKeys() {
  comp.close(form);
}

function handleDelete() {
  dispatch('delete', form);
  comp.close();
}
</script>
<DialogBase {title} let:close bind:this={comp}>
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
  <div class="mt-5" use:focusFirst on:keydown={onEnter(handleKeys)}>
    <slot></slot>
  </div>
  <div class="mt-5 sm:mt-6 text-center flex gap-2 justify-start">
    <Button on:click={() => close(form)}>OK</Button>
    <Button plain on:click={() => close()}>Cancel</Button>
    {#if showDelete}
      <div class="flex-grow"></div>
      <DeleteButton on:confirm={handleDelete}></DeleteButton>
    {/if}
  </div>
</DialogBase>