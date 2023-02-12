<script lang="ts">
import { browser } from "$app/environment";
import { Tab, TabGroup, TabList } from "@rgossiaux/svelte-headlessui";
import { tabManager } from "./data/ui-state";
export let tabs: {label: string}[];
export let id: string;

$: defaultTab = $tabManager[id] ?? 0;

function init() {
  if (!tabManager.init) {
    tabManager.load();
  }
}
</script>
<div class="relative rounded-lg bg-white shadow-xl dark:bg-gray-900 dark:shadow-purple-400/20 ring-1 ring-gray-900/5 flex flex-col">
  <TabGroup class="flex flex-col flex-1" defaultIndex={browser ? (init(), defaultTab) : 0} on:change={(e) => $tabManager[id] = e.detail}>
    <div class="pl-2 pr-4 sm:pl-4 sm:pr-6 border-b border-gray-200 dark:border-gray-600 flex">
      <TabList class="-mb-px flex space-x-8 flex-grow">
        {#each tabs as tab}
        <Tab class={({selected}) => `text-xl font-subtitle leading-6 relative top-px whitespace-nowrap py-5 px-2 border-b-3 ${selected ? 'text-purple-700 dark:text-purple-300 border-purple-500' : 'border-transparent hover:border-gray-500'}`}>{tab.label}</Tab>
        {/each}
      </TabList>
      <slot name="sidehead"></slot>
    </div>
    <div class="px-4 py-5 sm:p-6 flex flex-col flex-1">
      <slot></slot>
    </div>
  </TabGroup>
</div>