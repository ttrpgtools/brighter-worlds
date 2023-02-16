<script lang="ts">
  import { KNOWN_STATUSES } from '$lib/const';
  import Icon from "$lib/Icon.svelte";
  import { capitalize } from '$lib/util/string';
  export let status: string;
  export let enabled = true;
  export let size = '1.25rem';
  export let gap = 'gap-1.5';
  $: hasIcon = KNOWN_STATUSES.has(status);
</script>
<button type="button" on:click class="inline-flex items-center {gap} rounded border px-2.5 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-900 {enabled ? `bg-purple-200 border-purple-800 dark:bg-purple-800 dark:border-purple-200` : `border-gray-300 bg-white dark:bg-gray-900 dark:border-gray-600`}">
  {#if hasIcon}<span class={enabled ? `text-purple-800 dark:text-purple-200` : `text-gray-400 dark:text-gray-500`}><Icon icon={`status-${status}`} {size} /></span>{/if}
  <span>{capitalize(status)}</span>
</button>