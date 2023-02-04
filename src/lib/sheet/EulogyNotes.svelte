<script lang="ts">
import type { EulogyStanza } from "$lib/types";
import { TabGroup, TabList, Tab, TabPanels, TabPanel } from "@rgossiaux/svelte-headlessui";
import { createEventDispatcher } from "svelte";
import Card from "../Card.svelte";
export let eulogy: EulogyStanza[];
export let notes = '';
$: availableXp = eulogy.reduce((p, c) => p + (!!c.xp ? Math.max(c.xp - (c.spent ?? 0), 0) : 0), 0);

const dispatch = createEventDispatcher();

</script>

<TabGroup>
  <Card>
  <svelte:fragment slot="header">
    <TabList class="-mx-2 -my-3 sm:-mx-4 flex gap-2">
      <Tab class={({selected}) => `text-xl font-subtitle leading-6 py-3 px-5 rounded-md ${selected ? 'bg-purple-300 dark:bg-purple-700' : 'bg-gray-200 dark:bg-gray-800'}`}>Eulogy</Tab>
      <Tab class={({selected}) => `text-xl font-subtitle leading-6 py-3 px-5 rounded-md ${selected ? 'bg-purple-300 dark:bg-purple-700' : 'bg-gray-200 dark:bg-gray-800'}`}>Notes</Tab>
    </TabList>
    <div class="flex-shrink">Available XP: {availableXp}</div>
  </svelte:fragment>
  <!-- body -->
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
  </Card>
</TabGroup>
