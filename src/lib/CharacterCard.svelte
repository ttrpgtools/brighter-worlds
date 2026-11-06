<script lang="ts">
  import { DropdownMenu } from 'bits-ui';
  import Card from '$lib/ui/card.svelte';
  import Button from '$lib/ui/button.svelte';
  import Icon from '$lib/ui/icon.svelte';
  import MenuAction from '$lib/MenuAction.svelte';
  import { Die } from '$lib/dice/';
  import type { CharacterEntry } from '$lib/data/character-library';
  let {
    entry,
    busy = false,
    onbackup,
    onremove,
  }: {
    entry: CharacterEntry;
    busy?: boolean;
    onbackup: () => void;
    onremove?: () => void;
  } = $props();
</script>

<Card class="min-w-0">
  <div class="flex h-full flex-col gap-4">
    <div
      class="flex items-center justify-end gap-2 text-sm text-gray-500 dark:text-gray-400"
      title={entry.status}
    >
      <Icon icon={entry.storage === 'account' ? 'cloud' : 'desktop'} />
      <span>{entry.storage === 'account' ? 'Account' : 'Local'}</span>
      {#if entry.attention}<span
          class="size-2 rounded-full bg-amber-500"
          aria-label="Needs attention"
        ></span>{/if}
    </div>
    <h3 class="break-words text-center font-title text-4xl">
      {entry.name || 'Unnamed adventurer'}
    </h3>
    <p class="text-center font-subtitle text-3xl">{entry.calling || 'No calling'}</p>
    <div class="flex justify-around gap-6 py-2">
      {#each ['str', 'dex', 'wil'] as attribute (attribute)}
        <div
          class="relative flex h-9 w-12 items-center justify-center"
          aria-label={`${attribute.toUpperCase()}: ${entry[attribute as 'str' | 'dex' | 'wil'] ?? 'not cached'}`}
        >
          <span
            class="absolute left-1/2 top-1 -translate-x-1/2 text-3xl font-black tracking-tighter text-purple-200 dark:text-purple-800"
            aria-hidden="true">{attribute.toUpperCase()}</span
          >
          <span class="relative"
            >{#if entry[attribute as 'str' | 'dex' | 'wil']}<Die
                which={entry[attribute as 'str' | 'dex' | 'wil']!}
                size="w-8 h-8"
              />{:else}<span class="text-xl" aria-hidden="true">—</span>{/if}</span
          >
        </div>
      {/each}
    </div>
    <div class="mt-auto flex items-center justify-between gap-2">
      <div class="flex items-center gap-3">
        <Button href={entry.href}>View</Button>
        <Button
          size="icon"
          variant="ghost"
          icon="download"
          aria-label={`Download ${entry.name || 'character'} backup`}
          disabled={busy}
          onclick={onbackup}
        />
      </div>
      {#if onremove}
        <DropdownMenu.Root>
          <DropdownMenu.Trigger>
            {#snippet child({ props })}<button
                {...props}
                type="button"
                aria-label={`Options for ${entry.name || 'character'}`}
                class="inline-flex size-9 items-center justify-center rounded-full hover:bg-purple-100 dark:hover:bg-purple-800"
                ><Icon icon="dots" /></button
              >{/snippet}
          </DropdownMenu.Trigger>
          <DropdownMenu.Portal
            ><DropdownMenu.Content
              align="end"
              sideOffset={8}
              class="z-50 w-64 rounded-xl bg-white p-1 shadow-xl dark:bg-gray-900"
            >
              <MenuAction
                label={entry.storage === 'account'
                  ? 'Remove browser cache…'
                  : 'Delete local character…'}
                destructive
                disabled={busy}
                action={onremove}
              />
            </DropdownMenu.Content></DropdownMenu.Portal
          >
        </DropdownMenu.Root>
      {/if}
    </div>
    {#if entry.attention}<p class="text-sm text-amber-700 dark:text-amber-300" role="status">
        {entry.status}
      </p>{/if}
  </div>
</Card>
