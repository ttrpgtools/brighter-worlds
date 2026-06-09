<script lang="ts">
  import { cn } from '$lib/util/tw.js';
  import { Popover as PopoverPrimitive } from 'bits-ui';
  let {
    ref = $bindable(null),
    class: className,
    ...restProps
  }: PopoverPrimitive.TriggerProps = $props();
</script>

<PopoverPrimitive.Trigger
  bind:ref
  data-slot="popover-trigger"
  class={cn('', className)}
  {...restProps}
/>
