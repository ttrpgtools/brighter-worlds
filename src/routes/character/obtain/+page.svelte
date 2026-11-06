<script lang="ts">
  import HomeLink from '$lib/HomeLink.svelte';
  import MenuLink from '$lib/MenuLink.svelte';
  import { requestRollCall, rerequest } from '$lib/data/broadcast-hub';
  import Button from '$lib/ui/button.svelte';
  import type { Item } from '$lib/types';
  import { onMount } from 'svelte';
  import { readSharedItem } from '$lib/data/item-transfer';
  import InventoryHelper from './InventoryHelper.svelte';
  const chars = requestRollCall();
  let active = $derived(Array.from($chars.entries()));

  let obtainedItem: Item | undefined = $state();
  let selectedCharacterId: string | undefined = $state();
  let error = $state('');
  onMount(() => {
    const url = new URL(window.location.href);
    const enc = url.searchParams.get('item');
    if (enc) {
      try {
        obtainedItem = readSharedItem(enc);
      } catch {
        error = 'This item link is invalid or incomplete. Ask the sender to share it again.';
      }
    }
  });

  function addToInventory([id]: [string, unknown]) {
    selectedCharacterId = id;
  }
</script>

<HomeLink />
<main class="p-8 flex flex-col items-center gap-2">
  {#if error}<p role="alert">{error}</p>{/if}
  <h3 class="font-subtitle text-3xl mb-4 text-purple-800 dark:text-purple-300">
    You've obtained: {#if obtainedItem}{obtainedItem.name} x {obtainedItem.quantity ??
        1}{:else}nothing?{/if}
  </h3>
  {#if obtainedItem}
    {#if selectedCharacterId}
      <InventoryHelper id={selectedCharacterId} item={obtainedItem} />
    {:else}
      <p>
        Which of your characters should receive {(obtainedItem.quantity ?? 1) > 1 ? `them` : `it`}?
      </p>
      <div class="my-4 flex flex-col gap-4">
        {#each active as character (character[0])}
          <Button class="justify-center" onclick={() => addToInventory(character)}
            >{character[1].name}</Button
          >
        {:else}
          <p>Open a character sheet on this site in another tab, then check again.</p>
        {/each}
      </div>
      <Button onclick={rerequest}>Check open characters</Button>
    {/if}
  {/if}
  <MenuLink href="/" icon="logo-leaf">Home</MenuLink>
</main>
