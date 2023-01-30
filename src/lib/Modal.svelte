<script lang="ts">
import Button from "./Button.svelte";
import { blur, scale } from 'svelte/transition';
import { createEventDispatcher } from "svelte";
import { Die } from "./dice";
    import type { DieValue } from "./types";

export let show = false;
export let label = '';
export let dice: DieValue[] = []
const dispatch = createEventDispatcher();

function closeMe() {
  dispatch('close');
}
</script>
<div class="relative z-10" aria-labelledby="modal-title" role="dialog" aria-modal="true">
  <!--
    Background backdrop, show/hide based on modal state.

    Entering: "ease-out duration-300"
      From: "opacity-0"
      To: "opacity-100"
    Leaving: "ease-in duration-200"
      From: "opacity-100"
      To: "opacity-0"
  -->
  {#if show}
  <div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" transition:blur></div>

  <div class="fixed inset-0 z-10 overflow-y-auto">
    <div class="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
      <!--
        Modal panel, show/hide based on modal state.

        Entering: "ease-out duration-300"
          From: "opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
          To: "opacity-100 translate-y-0 sm:scale-100"
        Leaving: "ease-in duration-200"
          From: "opacity-100 translate-y-0 sm:scale-100"
          To: "opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
      -->
      <div transition:scale={{start: 0.5}} class="relative transform overflow-hidden rounded-lg bg-white px-4 pt-5 pb-4 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-sm sm:p-6">
        <div>
          <div class="flex gap-4 justify-center items-center">
            {#each dice as die}
            <div class="flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
              <Die which={die} />
            </div>
            {/each}
          </div>
          <div class="mt-3 text-center sm:mt-5">
            <h3 class="text-lg font-medium leading-6 text-gray-900" id="modal-title">{label}</h3>
          </div>
        </div>
        <div class="mt-5 sm:mt-6 text-center">
          <Button on:click={closeMe}>Close</Button>
        </div>
      </div>
    </div>
  </div>
  {/if}
</div>