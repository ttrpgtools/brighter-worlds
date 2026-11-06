<script lang="ts">
  import { onMount } from 'svelte';
  import { resolve } from '$app/paths';
  import Button from '$lib/ui/button.svelte';
  import CharacterCard from '$lib/CharacterCard.svelte';
  import { DropdownMenu } from 'bits-ui';
  import MenuAction from '$lib/MenuAction.svelte';
  import Icon from '$lib/ui/icon.svelte';
  import {
    characterEntries,
    filterCharacters,
    type CharacterFilter,
    type CharacterEntry,
  } from '$lib/data/character-library';
  import { loadList, getList, getSheetCache, deleteSheet } from '$lib/data/sheet-manager';
  import SheetBackups from '$lib/SheetBackups.svelte';
  import SheetRecovery from '$lib/SheetRecovery.svelte';
  import SheetTransfer from '$lib/SheetTransfer.svelte';
  import { writable } from 'svelte/store';
  import { getAccountSession, canSaveAccount, canReadAccount } from '$lib/data/account-session';
  import { accountClient, accountHref } from '$lib/data/account-client';
  import {
    cachedAccount,
    cacheAccountGraph,
    accountBundle,
    removeAccountCache,
    type AccountRecord,
  } from '$lib/data/account-persistence';
  import type { AegisListPage } from '$lib/server/aegis';
  import { reconcileLocalPromotions } from '$lib/data/account-promotion';
  import { download } from '$lib/util/download';
  const session = getAccountSession();
  let owner = $state('');
  let records: AccountRecord[] = $state.raw([]);
  let items: AegisListPage['items'] = $state.raw([]);
  let cursor: AegisListPage['nextCursor'] = $state.raw(null);
  let busy = $state(false);
  let error = $state('');
  let generation = 0;
  let lastAccess = '';
  const list = getList();
  const cache = getSheetCache();
  const localStatus = writable('Loading…');
  let backups: SheetBackups | undefined = $state();
  let filter: CharacterFilter = $state('all');
  let entries = $derived(characterEntries($list ?? [], owner, items, records));
  let visible = $derived(filterCharacters(entries, filter));
  async function refreshLocal() {
    await loadList(list, cache, localStatus);
  }
  async function remove(entry: CharacterEntry) {
    if (entry.storage === 'account') {
      await removeCache(entry.id);
      return;
    }
    if (confirm('Delete this local character? Its account copy, if any, stays untouched.'))
      await deleteSheet(entry.id, list);
  }
  async function load(reset = true) {
    const selected = owner;
    if (!selected) return;
    const request = ++generation;
    busy = true;
    error = '';
    try {
      if (await reconcileLocalPromotions(selected, session)) await refreshLocal();
      const cached = await cachedAccount(selected);
      if (request !== generation) return;
      records = cached;
      if (canSaveAccount(session, selected)) {
        const page = await accountClient(selected).list(reset ? undefined : cursor);
        if (request !== generation || owner !== selected) return;
        items = reset ? page.characters : [...items, ...page.characters];
        cursor = page.nextCursor;
      } else {
        items = [];
        cursor = null;
      }
    } catch (caught) {
      if (request === generation)
        error =
          caught instanceof Error
            ? caught.message
            : 'Account library unavailable. Cached drafts are kept.';
    } finally {
      if (request === generation) busy = false;
    }
  }
  onMount(() => {
    const stop = session.subscribe((current) => {
      const next = current.account?.user?.id ?? current.offlineOwner ?? '';
      const access = `${next}:${!!current.account?.allowed}:${current.epoch}`;
      if (access !== lastAccess) {
        lastAccess = access;
        owner = next;
        generation++;
        items = [];
        records = [];
        cursor = null;
        error = '';
        busy = false;
        if (next) void load();
      }
    });
    void refreshLocal();
    void session.refresh();
    return () => {
      generation++;
      stop();
    };
  });
  async function exportFile(id: string) {
    const selectedOwner = owner;
    busy = true;
    error = '';
    try {
      await cacheAccountGraph(selectedOwner, id, session);
      if (owner !== selectedOwner || !canReadAccount(session, selectedOwner)) return;
      const result = await accountBundle(selectedOwner, id);
      if (owner !== selectedOwner || !canReadAccount(session, selectedOwner)) return;
      download(JSON.stringify(result.bundle, null, 2), 'brighter-worlds-account-characters.json');
      if (result.warnings.length) error = result.warnings.join(' ');
    } catch (caught) {
      error =
        caught instanceof Error ? caught.message : 'The cached group could not be downloaded.';
    } finally {
      busy = false;
    }
  }
  async function removeCache(id: string) {
    const selected = owner;
    if (
      !confirm(
        'Remove this browser cache? The online sheet stays, and this draft is archived locally.',
      )
    )
      return;
    busy = true;
    error = '';
    try {
      await removeAccountCache(selected, id);
      if (owner === selected) await load();
    } catch (caught) {
      if (owner === selected)
        error = caught instanceof Error ? caught.message : 'The cached draft could not be removed.';
    } finally {
      busy = false;
    }
  }
</script>

<SheetRecovery {cache} />
<div class="mb-6 flex w-full max-w-6xl flex-wrap items-center justify-between gap-4">
  <div
    class="inline-flex rounded-full bg-purple-100 p-1 dark:bg-purple-950"
    role="group"
    aria-label="Filter characters"
  >
    {#each [{ value: 'all', label: 'All' }, { value: 'local', label: 'Local' }, { value: 'account', label: 'Account' }] as option (option.value)}
      <button
        type="button"
        aria-pressed={filter === option.value}
        onclick={() => {
          filter = option.value as CharacterFilter;
        }}
        class={[
          'rounded-full px-4 py-1.5 text-base transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500',
          filter === option.value
            ? 'bg-purple-300 shadow-sm dark:bg-purple-700'
            : 'hover:bg-purple-200 dark:hover:bg-purple-900',
        ]}>{option.label}</button
      >
    {/each}
  </div>
  <div class="flex flex-wrap items-center gap-2">
    <SheetTransfer onrestore={refreshLocal} onfile={() => backups?.open()} />
    <Button
      variant="ghost"
      size="icon"
      icon="download"
      aria-label="Backups and restore"
      title="Backups and restore"
      onclick={() => {
        void backups?.open();
      }}
    />
    {#if owner}<Button
        variant="ghost"
        size="icon"
        icon="cloud"
        title="Refresh account characters"
        aria-label="Refresh account characters"
        disabled={busy}
        onclick={() => load()}
      />{/if}
    <DropdownMenu.Root>
      <DropdownMenu.Trigger>
        {#snippet child({ props })}<button
            {...props}
            type="button"
            class="inline-flex items-center gap-3 rounded-full bg-primary-300 px-6 py-2 font-subtitle text-2xl shadow-sm hover:bg-primary-200 dark:bg-primary-700 dark:hover:bg-primary-800"
            ><Icon icon="nav-new-char" class="size-5" />New character<Icon
              icon="chevron-down"
            /></button
          >{/snippet}
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal
        ><DropdownMenu.Content
          align="end"
          sideOffset={8}
          class="z-50 w-72 rounded-xl bg-white p-1 shadow-xl dark:bg-gray-900"
        >
          <MenuAction label="New local character" icon="desktop" href={resolve('/character/new')} />
          {#if $session.account?.allowed}
            <MenuAction
              label="New account character"
              icon="cloud"
              href={`${resolve('/character/new')}?storage=account`}
            />
          {:else if !$session.account?.user}
            <MenuAction
              label="Sign in for account characters"
              icon="cloud"
              href={resolve('/auth/login')}
            />
          {:else}<MenuAction label="Account storage unavailable" icon="cloud" disabled />{/if}
        </DropdownMenu.Content></DropdownMenu.Portal
      >
    </DropdownMenu.Root>
  </div>
</div>
{#if error}<p class="mb-4 max-w-3xl text-amber-700 dark:text-amber-300" role="alert">
    {error}
  </p>{/if}
{#if busy}<p class="sr-only" role="status">Checking account characters…</p>{/if}
{#if owner && !$session.account?.allowed && filter !== 'local'}<p
    class="mb-4 text-sm text-gray-500 dark:text-gray-400"
  >
    Offline or account storage unavailable. Cached account drafts are included.
  </p>{/if}
<div class="mb-8 grid w-full max-w-6xl grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
  {#each visible as entry (entry.key)}
    <CharacterCard
      {entry}
      {busy}
      onbackup={() => {
        if (entry.storage === 'local') void backups?.downloadCharacter(entry.id);
        else void exportFile(entry.id);
      }}
      onremove={entry.storage === 'local' || entry.cached
        ? () => {
            void remove(entry);
          }
        : undefined}
    />
  {:else}
    <div class="col-span-full py-12 text-center text-gray-600 dark:text-gray-300">
      {#if $localStatus || busy}<p role="status">Loading your adventurers…</p>
      {:else if filter === 'account' && !owner}<p>Sign in to see your account characters.</p>
        <Button class="mt-4" href={resolve('/auth/login')}>Sign in</Button>
      {:else}<p>
          {filter === 'all'
            ? 'Your next adventure starts here. Create a character to begin.'
            : `No ${filter} characters yet.`}
        </p>{/if}
    </div>
  {/each}
</div>
{#if cursor && filter !== 'local'}<Button
    variant="outline"
    disabled={busy}
    onclick={() => load(false)}>Load more characters</Button
  >{/if}
<SheetBackups bind:this={backups} {cache} onrestore={refreshLocal} />
