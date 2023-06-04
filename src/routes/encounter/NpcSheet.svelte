<script lang="ts">
  import Card from "$lib/Card.svelte";
  import DeleteButton from "$lib/DeleteButton.svelte";
  import Attribute from "$lib/sheet/Attribute.svelte";
  import Equipment from "$lib/sheet/Equipment.svelte";
  import Grit from "$lib/sheet/Grit.svelte";
  import type { NpcInstance } from "$lib/types";

  export let npc: NpcInstance;
</script>
<div class="relative flex flex-col gap-2">
  <div class="relative">
    <input type="text" class="w-full border-0 dark:bg-gray-900 placeholder-shown:bg-gray-100 dark:placeholder-shown:bg-black focus:border-purple-600 focus:ring-0 font-title text-3xl p-4 rounded-lg h-full" placeholder="Name" bind:value={npc.name}>
    <div class="absolute inset-y-0 right-4 flex items-center">
      <DeleteButton on:confirm />
    </div>
  </div>
  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
    <Card>
      <div class="flex flex-col gap-4">
        <Grit bind:value={npc.grit} isDeprived={false} isBurdened={false} />
        <Attribute name="STR" value={npc.str} on:roll on:damage on:change />
        <Attribute name="DEX" value={npc.dex} on:roll on:damage on:change />
        <Attribute name="WIL" value={npc.wil} on:roll on:damage on:change />
        {#if npc.status}
        <div class="flex items-center gap-2 border w-fit py-2 px-3 rounded-md border-gray-300 bg-white dark:bg-gray-900 dark:hover:bg-gray-800 dark:border-gray-600 shadow-sm">
          <span>{npc.status}</span>
          <button type="button" title="Clear status" aria-label="Clear status" on:click={() => npc.status = ''} class="rounded-md bg-purple-900 p-0.5 text-white shadow-sm hover:bg-purple-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-600">
            <svg class="h-5 w-5 rotate-45" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
            </svg>
          </button>
        </div>
        {/if}
      </div>
    </Card>
    <div class="flex flex-col gap-4">
      <Equipment bind:equipment={npc.attacks} title="Attacks" bind:baseArmor={npc.armor} class="flex-1" on:roll />
      {#if npc.wants || npc.found || npc.notes?.length > 0}
      <Card>
      <div>
        <ul class="-my-5 divide-y divide-gray-200 dark:divide-gray-600">
          {#if npc.notes?.length > 0}
            {#each npc.notes as note}
              <li class="py-3">
                <p class="text-sm font-medium">{note}</p>
              </li>
            {/each}
          {/if}
          {#if npc.wants}
            <li class="py-3">
              <p class="text-sm font-medium"><strong class="text-purple-700 dark:text-purple-200">Wants:</strong> {npc.wants}</p>
            </li>
          {/if}
          {#if npc.found}
            <li class="py-3">
              <p class="text-sm font-medium"><strong class="text-purple-700 dark:text-purple-200">Often Found:</strong> {npc.found}</p>
            </li>
          {/if}
        </ul>
      </div>
      </Card>
      {/if}
    </div>
  </div>
</div>