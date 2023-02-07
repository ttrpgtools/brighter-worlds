<script lang="ts">
import Button from "./Button.svelte";
import DialogBase from "./DialogBase.svelte";
import { Die } from "./dice";
import type { DieValue } from "./types";
export let dice: DieValue[] = [];
export let title = '';
export let form: Record<string, string>;
let comp: DialogBase;
export async function open() {
  return comp.open<Record<string, string>>();
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
  <div class="mt-5">
    <slot {form}></slot>
  </div>
  <div class="mt-5 sm:mt-6 text-center flex gap-4 justify-end">
    <Button on:click={() => close(form)}>OK</Button>
    <Button on:click={() => close()}>Cancel</Button>
  </div>
</DialogBase>