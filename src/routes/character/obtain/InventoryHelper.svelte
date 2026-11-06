<script lang="ts">
  import { loadSheet } from '$lib/data/sheet-manager';
  import type { Item } from '$lib/types';
  import { receiveItem } from '$lib/data/item-transfer';
  import { onMount, untrack } from 'svelte';

  interface Props {
    id: string;
    item: Item;
  }

  let { id, item }: Props = $props();

  const chosen = loadSheet(untrack(() => id));
  let ok = $state(false);
  let error = $state('');
  onMount(() => {
    receiveItem(chosen, $state.snapshot(item))
      .then(() => {
        ok = true;
      })
      .catch(() => {
        error =
          'The item could not be saved. Open the character sheet and check its inventory and storage warning before trying again.';
      });
  });
</script>

{#if error}
  <p role="alert">{error}</p>
{:else if ok}
  <div>Added. You can close this window/tab.</div>
{:else}
  <p>Saving to your character…</p>
{/if}
