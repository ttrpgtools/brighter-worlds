<script lang="ts">
import Button from "./Button.svelte";
import DialogBase from "./DialogBase.svelte";
import { Die } from "./dice";
import type { DieValue } from "./types";
export let dice: DieValue[] = [];
export let title = '';
export let msg = '';
let comp: DialogBase<undefined>;
export async function open() {
  return comp.open<undefined>();
}
</script>
<DialogBase {title} let:open let:close bind:this={comp}>
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
  {#if !!msg}
  <div class="mt-2">
    <p class="text-sm text-gray-500">
      {msg}
    </p>
  </div>
  {/if}
  <div class="mt-5 sm:mt-6 text-center">
    <Button on:click={() => close()}>Close</Button>
  </div>
</DialogBase>