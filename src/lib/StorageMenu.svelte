<script lang="ts">
  import { DropdownMenu } from 'bits-ui';
  import Icon from '$lib/ui/icon.svelte';
  import type { Snippet } from 'svelte';
  let {
    icon,
    label,
    message,
    phase = 'local',
    children,
  }: {
    icon: string;
    label: string;
    message?: string;
    phase?: string;
    children?: Snippet;
  } = $props();
  let attention = $derived(['error', 'conflict', 'missing', 'signed-out'].includes(phase));
</script>

<DropdownMenu.Root>
  <DropdownMenu.Trigger>
    {#snippet child({ props })}
      <button
        {...props}
        type="button"
        aria-label={`${label}${message ? `: ${message}` : ''}`}
        title={message ?? label}
        class="relative inline-flex size-9 items-center justify-center rounded-full bg-purple-300 shadow-lg hover:bg-purple-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 dark:bg-purple-700 dark:shadow-purple-400/20 dark:hover:bg-purple-800"
      >
        <Icon {icon} class="size-4" />
        {#if phase !== 'local'}<span
            aria-hidden="true"
            class={[
              'absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full border-2 border-white dark:border-gray-800',
              attention ? 'bg-amber-500' : phase === 'saved' ? 'bg-emerald-500' : 'bg-purple-400',
              phase === 'saving' && 'animate-pulse',
            ]}
          ></span>{/if}
      </button>
    {/snippet}
  </DropdownMenu.Trigger>
  <DropdownMenu.Portal>
    <DropdownMenu.Content
      align="end"
      sideOffset={8}
      class="z-50 max-h-[calc(100dvh-4rem)] w-72 max-w-[calc(100vw-2rem)] overflow-y-auto rounded-xl bg-white p-1 text-gray-900 shadow-xl ring-1 ring-purple-500/10 dark:bg-gray-900 dark:text-white"
    >
      <div class="border-b border-purple-100 px-3 py-3 dark:border-purple-900">
        <p class="font-subtitle text-xl">{label}</p>
        {#if message}<p role="status" class="mt-1 text-sm text-gray-600 dark:text-gray-300">
            {message}
          </p>{/if}
      </div>
      <div class="py-1">{@render children?.()}</div>
    </DropdownMenu.Content>
  </DropdownMenu.Portal>
</DropdownMenu.Root>
