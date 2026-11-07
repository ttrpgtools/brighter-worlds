<script lang="ts">
  import { Select as SelectPrimitive, type WithoutChild } from 'bits-ui';
  import Icon from '$lib/ui/icon.svelte';
  import { cn, type ClassNameValue } from '$lib/util/tw';

  let {
    ref = $bindable(null),
    class: className,
    children,
    ...restProps
  }: WithoutChild<SelectPrimitive.TriggerProps> & { class?: ClassNameValue } = $props();
</script>

<SelectPrimitive.Trigger
  bind:ref
  class={cn(
    'border-gray-300 dark:border-gray-600 bg-background bg-white dark:bg-gray-900 dark:hover:bg-gray-800 py-2 px-3 text-left shadow-sm focus:border-purple-500 focus:ring-purple-500 flex gap-2 w-full items-center justify-between cursor-default rounded-md border text-sm focus:outline-none focus:ring-2 focus:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1',
    className,
  )}
  {...restProps}
>
  {@render children?.()}
  <Icon icon="chevron-down" class="size-4 opacity-50" />
</SelectPrimitive.Trigger>
