<script lang="ts">
import Button from "./Button.svelte";
import DialogBase from "./DialogBase.svelte";
import { Die } from "./dice";
import type { DieValue } from "./types";
export let dice: DieValue[] = [];
export let title = '';
export let msg = '';
export let titleClass = '';
export let msgClass = '';
type T = $$Generic;
export let choices: {value: T; label: string;}[];
let comp: DialogBase<T>;
export async function open() {
  return comp.open<T>();
}
function close(value: T) {
  comp.close(value);
}
</script>
<DialogBase bind:this={comp}>
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
    <h3 class="text-xl font-medium leading-6 text-center {titleClass}">{title}</h3>
  </div>
  {#if !!msg}
  <div class="mt-2">
    <p class="text-center {msgClass}">
      {msg}
    </p>
  </div>
  {/if}
  <div class="mt-5 sm:mt-6 flex gap-4 justify-center" slot="footer">
    {#each choices as choice}
    <Button on:click={() => close(choice.value)}>{choice.label}</Button>
    {/each}
  </div>
</DialogBase>