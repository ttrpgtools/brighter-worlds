<script lang="ts">
  import { Tabs as TabsPrimitive } from 'bits-ui';
  import { cn, type ClassNameValue } from '$lib/util/tw';

  let {
    ref = $bindable(null),
    class: className,
    ...restProps
  }: TabsPrimitive.ListProps & { class?: ClassNameValue } = $props();
</script>

<TabsPrimitive.List
  bind:ref
  class={cn('pl-2 pr-4 sm:pl-4 sm:pr-6 flex gap-8 items-center', className)}
  {...restProps}
/>
