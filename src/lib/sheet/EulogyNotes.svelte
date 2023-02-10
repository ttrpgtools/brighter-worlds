<script lang="ts">
  import AutoTextarea from "$lib/AutoTextarea.svelte";
import TabbedCard from "$lib/TabbedCard.svelte";
import type { EulogyStanza } from "$lib/types";
import { TabPanels, TabPanel } from "@rgossiaux/svelte-headlessui";
import { createEventDispatcher } from "svelte";
export let eulogy: EulogyStanza[];
export let notes = '';
$: availableXp = eulogy.reduce((p, c) => p + (!!c.xp ? Math.max(c.xp - (c.spent ?? 0), 0) : 0), 0);

const dispatch = createEventDispatcher();

let stanza = {
  message: '',
  xp: '1',
};

function addStanza() {
  if (stanza.message !== '' && stanza.xp !== '') {
    eulogy = [...eulogy, { message: stanza.message, xp: parseInt(stanza.xp, 10), spent: 0 }];
    stanza.message = '';
    stanza.xp = '1';
  }
}
</script>


<TabbedCard tabs={[{label: 'Eulogy'},{label: 'Notes'}]}>
  <div slot="sidehead" class="py-4 flex gap-2 items-center"><span class="text-lg font-subtitle inline-block h-6">XP:</span><span class="">{availableXp}</span></div>
  <TabPanels>
    <TabPanel>
      {#each eulogy as stanza}
        <p class="mb-4">{stanza.message}</p>
      {/each}
      <div class="flex items-center gap-4">
        <input type="text" name="message" placeholder="Message" bind:value={stanza.message} class="rounded-full dark:bg-gray-900 dark:text-white focus:ring-purple-500 focus:border-purple-500 flex-grow">
        <input type="text" name="xp" placeholder="XP" size={3} bind:value={stanza.xp} class="rounded-full dark:bg-gray-900 dark:text-white focus:ring-purple-500 focus:border-purple-500">
        <button type="button" on:click={addStanza} class="relative inline-flex items-center rounded-full bg-purple-300 dark:bg-purple-700 p-1 font-medium shadow-sm hover:bg-purple-200 dark:hover:bg-purple-800 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-900"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" class="h-4 w-4"><path fill="currentColor" d="M256 80c0-17.7-14.3-32-32-32s-32 14.3-32 32V224H48c-17.7 0-32 14.3-32 32s14.3 32 32 32H192V432c0 17.7 14.3 32 32 32s32-14.3 32-32V288H400c17.7 0 32-14.3 32-32s-14.3-32-32-32H256V80z"/></svg></button>
      </div>
    </TabPanel>
    <TabPanel>
      <AutoTextarea bind:value={notes} maxRows={8} minRows={4}></AutoTextarea>
    </TabPanel>
  </TabPanels>
</TabbedCard>
