<script lang="ts">
  import Card from "$lib/Card.svelte";
  import type { Ability, Calling, Entity } from "$lib/types";
  import CallingDetailDialog from "./CallingDetailDialog.svelte";

  export let calling: Entity;
  export let abilities: Ability[];
  export let callingList: Calling[];

  let callingDialog: CallingDetailDialog;
  $: callingData = callingList.find(x => x.id === calling.id);
</script>
{#if callingData != null}
  <CallingDetailDialog calling={callingData} bind:this={callingDialog} />
{/if}
<Card>
  <div class="flex items-center gap-2 w-full" slot="header">
    <h3 class="text-xl font-subtitle leading-6">{calling.name}</h3>
    <p class="text-gray-500 relative -top-1">(Calling)</p>
    <div class="flex-1 text-right">
      <button type="button" on:click={() => callingDialog.open()} class="relative inline-flex items-center rounded-full bg-purple-300 dark:bg-purple-700 p-1 font-medium shadow-sm hover:bg-purple-200 dark:hover:bg-purple-800 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-900"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" class="h-4 w-4"><path fill="currentColor" d="M256 0C114.6 0 0 114.6 0 256s114.6 256 256 256s256-114.6 256-256S397.4 0 256 0zM256 464c-114.7 0-208-93.31-208-208S141.3 48 256 48s208 93.31 208 208S370.7 464 256 464zM296 336h-16V248C280 234.8 269.3 224 256 224H224C210.8 224 200 234.8 200 248S210.8 272 224 272h8v64h-16C202.8 336 192 346.8 192 360S202.8 384 216 384h80c13.25 0 24-10.75 24-24S309.3 336 296 336zM256 192c17.67 0 32-14.33 32-32c0-17.67-14.33-32-32-32S224 142.3 224 160C224 177.7 238.3 192 256 192z"/></svg></button>
    </div>
  </div>
  {#if calling.desc}
  <div class="mb-3">
    {calling.desc}
  </div>
  {/if}
  <ul class="pl-4">
    {#each abilities as ability}
    <li class="list-disc mb-2"><strong>{ability.name}</strong>{@html ability.desc}</li>
    {/each}
  </ul>
</Card>