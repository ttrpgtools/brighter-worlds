<script lang="ts">
  import DeleteButton from "$lib/DeleteButton.svelte";
  import Disclosable from "$lib/Disclosable.svelte";
  import Icon from "$lib/Icon.svelte";
  import IconButton from "$lib/IconButton.svelte";
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
      <IconButton icon="share" on:click={() => dispatch('share')} />
      <DeleteButton on:confirm size="w-3 h-3"/>
    </div>
  </svelte:fragment>
  <div class="prose dark:prose-invert prose-purple">
    {#if item.quantity}({#if item.quantFormula}<button on:click={reroll} class="border-gray-600 dark:border-gray-300 border-dotted border-b">{item.quantity}</button>{:else}{item.quantity}{/if}){/if}
    {@html item.desc}
  </div>
</Disclosable>