<script lang="ts">
  import { DropdownMenu } from 'bits-ui';
  import Icon from '$lib/ui/icon.svelte';
  import Button from '$lib/ui/button.svelte';
  let {
    label,
    icon,
    action,
    href,
    disabled = false,
    destructive = false,
  }: {
    label: string;
    icon?: string;
    action?: () => void;
    href?: string;
    disabled?: boolean;
    destructive?: boolean;
  } = $props();
  const itemClass =
    'flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-base data-highlighted:bg-purple-500 data-highlighted:text-white data-disabled:opacity-40 data-disabled:pointer-events-none';
</script>

<DropdownMenu.Item
  {disabled}
  textValue={label}
  onSelect={action}
  class={[itemClass, destructive && 'text-red-700 dark:text-red-300']}
>
  {#snippet child({ props })}
    {#if href}<Button
        {...props}
        {href}
        variant="ghost"
        class={[itemClass, 'justify-start rounded-md px-3 py-2 text-base']}
        >{#if icon}<Icon {icon} />{/if}{label}</Button
      >
    {:else}<div {...props}>
        {#if icon}<Icon {icon} />{/if}{label}
      </div>{/if}
  {/snippet}
</DropdownMenu.Item>
