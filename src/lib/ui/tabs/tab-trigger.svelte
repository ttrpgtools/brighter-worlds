<script lang="ts">
  import { Tabs as TabsPrimitive } from 'bits-ui';
  import { cn, type ClassNameValue } from '$lib/util/tw';

  let {
    ref = $bindable(null),
    class: className,
    ...restProps
  }: TabsPrimitive.TriggerProps & { class?: ClassNameValue } = $props();
</script>

<TabsPrimitive.Trigger
  bind:ref
  class={cn(
    'ring-offset-background -mb-px focus-visible:ring-ring inline-flex items-center justify-center transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
    `text-xl font-subtitle leading-6 relative top-px whitespace-nowrap py-5 px-2 border-b-3 data-[state=active]:text-primary-700 dark:data-[state=active]:text-primary-300 data-[state=active]:border-purple-500 border-transparent hover:border-gray-500`,
    className,
  )}
  {...restProps}
/>
