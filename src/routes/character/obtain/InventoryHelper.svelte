<script lang="ts">
  import { loadSheet } from '$lib/data/sheet-manager';
  import type { Item } from '$lib/types';
  import { receiveItem } from '$lib/data/item-transfer';
  import { onMount, untrack } from 'svelte';
  import { getAccountSession } from '$lib/data/account-session';
  import { createAccountSheet } from '$lib/data/account-persistence';
  import { readable } from 'svelte/store';

  interface Props {
    id: string;
    item: Item;
  }

  let { id, item }: Props = $props();

  const target = untrack(() => id);
  const parts = /^account:([^:]+):([A-Za-z0-9_-]{1,128})$/.exec(target);
  const account = parts
    ? createAccountSheet(decodeURIComponent(parts[1]), parts[2], getAccountSession(), {
        autoSave: false,
      })
    : undefined;
  const chosen = account?.sheet ?? loadSheet(target);
  const saveStatus = account?.status ?? readable({ message: '' });
  let ok = $state(false);
  let error = $state('');
  onMount(() => {
    receiveItem(chosen, $state.snapshot(item))
      .then(async () => {
        if (account) await account.flush();
        ok = true;
      })
      .catch(() => {
        error =
          'The item could not be saved. Open the character sheet and check its inventory and storage warning before trying again.';
      });
    return () => account?.dispose();
  });
</script>

{#if error}
  <p role="alert">{error}</p>
{:else if ok}
  {#if account}<p>Added to this browser’s account draft. {$saveStatus.message}</p>{:else}<div>
      Added. You can close this window/tab.
    </div>{/if}
{:else}
  <p>Saving to your character…</p>
{/if}
