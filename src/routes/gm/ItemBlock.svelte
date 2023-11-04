<script lang="ts">
  import DeleteButton from "$lib/DeleteButton.svelte";
  import Disclosable from "$lib/Disclosable.svelte";
  import Icon from "$lib/Icon.svelte";
  import { rollFormula } from "$lib/rolling/roll";
  import type { Item } from "$lib/types";
  import { createEventDispatcher } from "svelte";

  export let item: Item;

  $: src = typeof(item.image) === 'string' ? item.image : '';

  const dispatch = createEventDispatcher();

  function reroll() {
    if (item.quantFormula) {
      item.quantity = rollFormula(item.quantFormula);
    }
  }
</script>
<Disclosable imgalt={`Photo of ${item.name}`} imgsrc={src} short>
  <svelte:fragment slot="header">
    <h3 class="text-xl font-subtitle leading-6 flex-1 flex items-center gap-2"><Icon icon="nav-relics"/><span class="relative top-0.5">{item.name}</span></h3>
    <div class="ml-auto flex gap-3 items-center">
      <button type="button" on:click={() => dispatch('share')} class="rounded-full leading-none h-6 w-6 bg-purple-300 dark:bg-purple-900 flex items-center justify-center"><span class="relative -top-px w-3 h-3"><svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 448 512"><path d="M352 224c53 0 96-43 96-96s-43-96-96-96s-96 43-96 96c0 4 .2 8 .7 11.9l-94.1 47C145.4 170.2 121.9 160 96 160c-53 0-96 43-96 96s43 96 96 96c25.9 0 49.4-10.2 66.6-26.9l94.1 47c-.5 3.9-.7 7.8-.7 11.9c0 53 43 96 96 96s96-43 96-96s-43-96-96-96c-25.9 0-49.4 10.2-66.6 26.9l-94.1-47c.5-3.9 .7-7.8 .7-11.9s-.2-8-.7-11.9l94.1-47C302.6 213.8 326.1 224 352 224z"/></svg></span></button>
      <DeleteButton on:confirm size="w-3 h-3"/>
    </div>
  </svelte:fragment>
  <div class="prose dark:prose-invert prose-purple">
    {#if item.quantity}({#if item.quantFormula}<button on:click={reroll} class="border-gray-600 dark:border-gray-300 border-dotted border-b">{item.quantity}</button>{:else}{item.quantity}{/if}){/if}
    {@html item.desc}
  </div>
</Disclosable>