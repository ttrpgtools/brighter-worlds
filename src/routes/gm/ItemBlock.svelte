<script lang="ts">
  import DeleteButton from '$lib/DeleteButton.svelte';
  import Disclosable from '$lib/Disclosable.svelte';
  import Icon from '$lib/ui/icon.svelte';
  import Button from '$lib/ui/button.svelte';
  import { rollFormula } from '$lib/rolling/roll';
  import type { Item } from '$lib/types';

  interface Props {
    item: Item;
    onshare: () => void;
    ondelete: () => void;
  }

  let { item = $bindable(), onshare, ondelete }: Props = $props();

  let src = $derived(typeof item.image === 'string' ? item.image : '');

  function reroll() {
    if (item.quantFormula) {
      item.quantity = rollFormula(item.quantFormula);
    }
  }
</script>

<Disclosable imgalt={`Photo of ${item.name}`} imgsrc={src} short>
  {#snippet header()}
    <h3 class="text-xl font-subtitle leading-6 flex-1 flex items-center gap-2">
      <Icon icon="nav-relics" /><span class="relative top-0.5">{item.name}</span>
    </h3>
    <div class="ml-auto flex gap-3 items-center">
      <Button size="icon" icon="share" onclick={onshare} />
      <DeleteButton onconfirm={ondelete} size="w-3 h-3" />
    </div>
  {/snippet}
  <div class="prose dark:prose-invert prose-purple">
    {#if item.quantity}({#if item.quantFormula}<button
          onclick={reroll}
          class="border-gray-600 dark:border-gray-300 border-dotted border-b"
          >{item.quantity}</button
        >{:else}{item.quantity}{/if}){/if}
    {@html item.desc}
  </div>
</Disclosable>
