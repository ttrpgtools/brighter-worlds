<script lang="ts">
  import HomeLink from "$lib/HomeLink.svelte";
  import MenuLink from "$lib/MenuLink.svelte";
  import { requestRollCall } from "$lib/data/broadcast-hub";
  import Button from "$lib/Button.svelte";
  import type { Item } from "$lib/types";
  import { onMount } from "svelte";
  import { decode } from "$lib/util/b64";
  import InventoryHelper from "./InventoryHelper.svelte";
  const chars = requestRollCall();
  $: active = Array.from($chars.entries());

  let obtainedItem: Item | undefined;
  let selectedCharacterId: string | undefined;
  onMount(() => {
    const url = new URL(window.location.href);
    const enc = url.searchParams.get('item');
    if (enc) {
      const json = decode(enc);
      const item = JSON.parse(json) as Item;
      obtainedItem = item;
    }
  });

  function addToInventory([id]: [string, unknown]) {
    selectedCharacterId = id;
  }
</script>
<HomeLink />
<main class="p-8 flex flex-col items-center gap-2">
  <h3 class="font-subtitle text-3xl mb-4 text-purple-800 dark:text-purple-300">You've obtained: {#if obtainedItem}{obtainedItem.name} x {obtainedItem.quantity ?? 1}{:else}nothing?{/if}</h3>
  {#if obtainedItem}
    {#if selectedCharacterId}
    <InventoryHelper id={selectedCharacterId} item={obtainedItem}/>
    {:else}
    <p>Which of your characters should receive {obtainedItem.quantity ?? 1 > 1 ? `them` : `it`}?</p>
    <div class="my-4 flex flex-col gap-4">
      {#each active as character}
      <Button class="justify-center" on:click={() => addToInventory(character)}>{character[1].name}</Button>
      {:else}
      <p>No open characters...</p>
      {/each}
    </div>
    {/if}
  {/if}
  <MenuLink href="/" icon="logo-leaf">Home</MenuLink>
</main>