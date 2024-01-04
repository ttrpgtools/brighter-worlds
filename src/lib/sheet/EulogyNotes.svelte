<script lang="ts">
import AutoTextarea from "$lib/AutoTextarea.svelte";
import TabbedCard from "$lib/TabbedCard.svelte";
import type { EulogyStanza } from "$lib/types";
import { xp } from "$lib/util/character";
import { onEnter } from "$lib/util/handlers";
import { TabPanels, TabPanel } from "@rgossiaux/svelte-headlessui";
import EulogyDialog from "./EulogyDialog.svelte";
export let eulogy: EulogyStanza[];
export let notes = '';

let availableXp = 0;
$: {
  availableXp = xp(eulogy);
};

let dialog: EulogyDialog;

</script>

<EulogyDialog bind:eulogy bind:this={dialog} />
<TabbedCard tabs={[{label: 'Epitaph'},{label: 'Notes'}]} id="eulogy" class="md:h-[25rem] lg:order-2">
  <div slot="sidehead" class="py-4 flex gap-2 items-center"><span class="text-lg font-subtitle inline-block h-6">XP:</span><span class="" >{availableXp}</span></div>
  <TabPanels class="h-full">
    <TabPanel>
      {#each eulogy as stanza (stanza.id)}
      <div class="mb-4 pl-7 relative">
        <span class="font-symbol text-2xl text-purple-500 inline-block w-4 absolute left-0 -top-1">{#if stanza.xp && stanza.spent}f{:else if !stanza.xp}Y{:else}p{/if}</span>
        <button type="button" class="cursor-pointer select-text" on:click={() => dialog.editStanza(stanza.id)} on:keydown={onEnter(() => dialog.editStanza(stanza.id))}>{stanza.message}</button>
      </div>
      {:else}
      <div class="mb-4">
        <p class="italic text-gray-600 dark:text-gray-400">Nothing noteworthy...</p>
      </div>
      {/each}
      <button type="button" on:click={() => dialog.addStanza()} class="relative inline-flex items-center rounded-full bg-purple-300 dark:bg-purple-700 p-1 font-medium shadow-sm hover:bg-purple-200 dark:hover:bg-purple-800 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-900"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" class="h-4 w-4"><path fill="currentColor" d="M256 80c0-17.7-14.3-32-32-32s-32 14.3-32 32V224H48c-17.7 0-32 14.3-32 32s14.3 32 32 32H192V432c0 17.7 14.3 32 32 32s32-14.3 32-32V288H400c17.7 0 32-14.3 32-32s-14.3-32-32-32H256V80z"/></svg></button>
    </TabPanel>
    <TabPanel class="h-full">
      <AutoTextarea bind:value={notes} maxRows={12} minRows={5}></AutoTextarea>
    </TabPanel>
  </TabPanels>
</TabbedCard>
