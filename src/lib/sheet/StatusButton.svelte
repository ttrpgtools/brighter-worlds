<script lang="ts">
  import Button, { type ButtonProps } from '$lib/ui/button.svelte';
  import { KNOWN_STATUSES } from '$lib/const';
  import { capitalize } from '$lib/util/string';
  import Icon from '$lib/ui/icon.svelte';
  type StatusButtonProps = ButtonProps & {
    status: string;
    enabled?: boolean;
  };
  // class="inline-flex items-center {gap} rounded border px-2.5 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-900 {enabled ? `bg-purple-200 border-purple-800 dark:bg-purple-800 dark:border-purple-200` : `border-gray-300 bg-white dark:bg-gray-900 dark:border-gray-600`}"
  let { status, enabled = true, ...btnProps }: StatusButtonProps = $props();
  let icon = $derived(KNOWN_STATUSES.has(status) ? `status-${status}` : undefined);
</script>

<Button
  {...btnProps}
  variant="status"
  size="sm"
  class={[enabled && 'bg-purple-200 border-purple-800 dark:bg-purple-800 dark:border-purple-200']}
>
  {#if icon}<span
      class={enabled ? `text-purple-800 dark:text-purple-200` : `text-gray-400 dark:text-gray-500`}
      ><Icon {icon} /></span
    >{/if}
  <span>{capitalize(status)}</span>
</Button>
