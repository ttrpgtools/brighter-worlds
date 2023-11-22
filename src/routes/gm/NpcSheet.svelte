<script lang="ts">
  import Card from "$lib/Card.svelte";
  import DeleteButton from "$lib/DeleteButton.svelte";
  import Disclosable from "$lib/Disclosable.svelte";
  import Icon from "$lib/Icon.svelte";
  import IconButton from "$lib/IconButton.svelte";
  import DieSelector from "$lib/sheet/DieSelector.svelte";
  import Equipment from "$lib/sheet/Equipment.svelte";
  import RollSelector from "$lib/sheet/RollSelector.svelte";
  import type { DieRollSet, NpcInstance } from "$lib/types";
  import { createEventDispatcher } from "svelte";
  const dispatch = createEventDispatcher();

  function takeDamage(ev: CustomEvent<{dice: DieRollSet}>) {
    dispatch('damage', {mod: ev.detail.dice.mod});
  }

  export let npc: NpcInstance;
  $: src = typeof(npc.image) === 'string' ? npc.image : '';
</script>
<Disclosable overflowable short imgalt={`Photo of ${npc.name}`} imgsrc={src} imgclass="lg:rounded-bl-lg max-h-[9rem] self-end">
  <svelte:fragment slot="header">
    <div class="relative w-full flex items-center">
      <Icon icon="nav-bestiary"/>
      <input type="text" class="w-full border-0 relative py-1 top-0.5 dark:bg-gray-900 placeholder-shown:bg-gray-100 dark:placeholder-shown:bg-black focus:border-purple-600 focus:ring-0 font-subtitle text-xl h-full" placeholder="Name" bind:value={npc.name}>
      <div class="absolute inset-y-0 gap-3 right-0 flex items-center">
        <IconButton icon="share" on:click={() => dispatch('share')} />
        <DeleteButton on:confirm size="w-3 h-3"/>
      </div>
    </div>
  </svelte:fragment>
  <div class="relative flex flex-col gap-2">
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <div class="grid grid-cols-4 gap-2">
          <input type="number" min="0" max="12" class="block accent-purple-500 text-lg py-2 px-3 rounded-md border-gray-300 bg-white dark:bg-gray-900 dark:hover:bg-gray-800 dark:border-gray-600 shadow-sm focus:border-purple-500 focus:ring-purple-500" bind:value={npc.grit.current}>
          <DieSelector bind:current={npc.str.current} nullable invalid={npc.str.current > npc.str.max} />
          <DieSelector bind:current={npc.dex.current} nullable invalid={npc.dex.current > npc.dex.max} />
          <DieSelector bind:current={npc.wil.current} nullable invalid={npc.wil.current > npc.wil.max} />

          <RollSelector class="justify-self-center" label="" die={4} let:events on:roll={takeDamage}>
            <button use:events type="button" class="inline-flex items-center rounded-full border border-transparent bg-purple-300 dark:bg-purple-700 px-4 py-2 text-xs font-medium shadow-sm hover:bg-purple-200 dark:hover:bg-purple-800 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-900" title="Take {name} Damage"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 512" class="w-7"><path fill="currentColor" d="M256 32c0-17.7-14.3-32-32-32s-32 14.3-32 32l0 9.8c0 39-23.7 74-59.9 88.4C71.6 154.5 32 213 32 278.2V352c0 17.7 14.3 32 32 32s32-14.3 32-32l0-73.8c0-10 1.6-19.8 4.5-29L261.1 497.4c9.6 14.8 29.4 19.1 44.3 9.5s19.1-29.4 9.5-44.3L222.6 320H224l80 0 38.4 51.2c10.6 14.1 30.7 17 44.8 6.4s17-30.7 6.4-44.8l-43.2-57.6C341.3 263.1 327.1 256 312 256l-71.5 0-56.8-80.2-.2-.3c44.7-29 72.5-79 72.5-133.6l0-9.8zM96 80c0-26.5-21.5-48-48-48S0 53.5 0 80s21.5 48 48 48s48-21.5 48-48zM464 286.1l58.6 53.9c4.8 4.4 11.9 5.5 17.8 2.6s9.5-9 9-15.5l-5.6-79.4 78.7-12.2c6.5-1 11.7-5.9 13.1-12.2s-1.1-13-6.5-16.7l-65.6-45.1L603 92.2c3.3-5.7 2.7-12.8-1.4-17.9s-10.9-7.2-17.2-5.3L508.3 92.1l-29.4-74C476.4 12 470.6 8 464 8s-12.4 4-14.9 10.1l-29.4 74L343.6 68.9c-6.3-1.9-13.1 .2-17.2 5.3s-4.6 12.2-1.4 17.9l39.5 69.1-65.6 45.1c-5.4 3.7-8 10.3-6.5 16.7c.1 .3 .1 .6 .2 .8l19.4 0c20.1 0 39.2 7.5 53.8 20.8l18.4 2.9L383 265.3l36.2 48.3c2.1 2.8 3.9 5.7 5.5 8.6L464 286.1z"/></svg></button>
          </RollSelector>
          <RollSelector class="justify-self-center" label="STR Save" die={npc.str.current || 4} let:events on:roll>
            <button use:events type="button" title="Roll STR Save" class="font-subtitle text-xl bg-purple-300 dark:bg-purple-700 hover:bg-purple-200 dark:hover:bg-purple-800 rounded-full px-2 pt-2 pb-1 w-16 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-900">STR</button>
          </RollSelector>
          <RollSelector class="justify-self-center" label="DEX Save" die={npc.dex.current || 4} let:events on:roll>
            <button use:events type="button" title="Roll DEX Save" class="font-subtitle text-xl bg-purple-300 dark:bg-purple-700 hover:bg-purple-200 dark:hover:bg-purple-800 rounded-full px-2 pt-2 pb-1 w-16 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-900">DEX</button>
          </RollSelector>
          <RollSelector class="justify-self-center" label="WIL Save" die={npc.wil.current || 4} let:events on:roll>
            <button use:events type="button" title="Roll WIL Save" class="font-subtitle text-xl bg-purple-300 dark:bg-purple-700 hover:bg-purple-200 dark:hover:bg-purple-800 rounded-full px-2 pt-2 pb-1 w-16 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-900">WIL</button>
          </RollSelector>
          {#if npc.status}
          <div class="col-span-4">
            <div class="flex items-center gap-2 border w-fit py-2 px-3 rounded-md border-gray-300 bg-white dark:bg-gray-900 dark:hover:bg-gray-800 dark:border-gray-600 shadow-sm">
              <span>{npc.status}</span>
              <button type="button" title="Clear status" aria-label="Clear status" on:click={() => npc.status = ''} class="rounded-md bg-purple-900 p-0.5 text-white shadow-sm hover:bg-purple-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-600">
                <svg class="h-5 w-5 rotate-45" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
                </svg>
              </button>
            </div>
          </div>
          {/if}
        </div>
      </div>
      <div class="flex flex-col gap-4">
        <Equipment bind:equipment={npc.attacks} title="Attacks" bind:baseArmor={npc.armor} class="flex-1" on:roll flat />
        {#if (npc.wants || npc.found) && npc.notes?.length > 120}
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
</Disclosable>