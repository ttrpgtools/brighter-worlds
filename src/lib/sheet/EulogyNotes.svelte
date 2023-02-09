<script lang="ts">
import TabbedCard from "$lib/TabbedCard.svelte";
import type { EulogyStanza } from "$lib/types";
import { TabPanels, TabPanel } from "@rgossiaux/svelte-headlessui";
import { createEventDispatcher } from "svelte";
export let eulogy: EulogyStanza[];
export let notes = '';
$: availableXp = eulogy.reduce((p, c) => p + (!!c.xp ? Math.max(c.xp - (c.spent ?? 0), 0) : 0), 0);

const dispatch = createEventDispatcher();

</script>


<TabbedCard tabs={[{label: 'Eulogy'},{label: 'Notes'}]}>
  <div slot="sidehead" class="py-4 flex gap-2 items-center"><span class="text-lg font-subtitle inline-block h-6">XP:</span><span class="">{availableXp}</span></div>
  <TabPanels>
    <TabPanel>
      {#each eulogy as stanza}
        <p>{stanza.message}</p>
      {/each}
    </TabPanel>
    <TabPanel>
      {notes}
    </TabPanel>
  </TabPanels>
</TabbedCard>
