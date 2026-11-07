<script lang="ts">
  import { Select as SelectPrimitive, type WithoutChildrenOrChild } from 'bits-ui';
  import Icon from '$lib/ui/icon.svelte';
  import { cn, type ClassNameValue } from '$lib/util/tw';

  let {
    ref = $bindable(null),
    class: className,
    ...restProps
  }: WithoutChildrenOrChild<SelectPrimitive.ScrollDownButtonProps> & {
    class?: ClassNameValue;
  } = $props();
</script>

<SelectPrimitive.ScrollDownButton
  bind:ref
  class={cn('flex cursor-default items-center justify-center py-1', className)}
  {...restProps}
>
  <Icon icon="cheveron-down" class="size-4" />
</SelectPrimitive.ScrollDownButton>
