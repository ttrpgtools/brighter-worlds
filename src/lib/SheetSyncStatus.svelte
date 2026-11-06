<script lang="ts">
  import { onMount, untrack } from 'svelte';
  import Button from '$lib/ui/button.svelte';
  import DialogBase from '$lib/DialogBase.svelte';
  import SaveOnline from '$lib/SaveOnline.svelte';
  import StorageMenu from '$lib/StorageMenu.svelte';
  import MenuAction from '$lib/MenuAction.svelte';
  import type { AccountSheet } from '$lib/data/account-persistence';
  import { accountBundle, accountKey, cacheAccountGraph } from '$lib/data/account-persistence';
  import { getAccountSession, canReadAccount } from '$lib/data/account-session';
  import { privateRecoveryFile } from '$lib/data/private-recovery';
  import { keepAccountLocally } from '$lib/data/account-transfer';
  import type { SheetCache } from '$lib/data/sheet-manager';
  import { download } from '$lib/util/download';
  import { resolve } from '$app/paths';
  import { saveCachedCompanions } from '$lib/data/account-creation';
  let {
    controller,
    owner,
    id,
    cache,
  }: { controller: AccountSheet; owner: string; id: string; cache: SheetCache } = $props();
  const status = untrack(() => controller.status);
  const session = getAccountSession();
  let busy = $state(false);
  let error = $state('');
  let localHref = $state('');
  let duplicate: SaveOnline | undefined = $state();
  let notice: DialogBase<undefined> | undefined = $state();
  let preview: Awaited<ReturnType<AccountSheet['review']>> | undefined = $state.raw();
  let conflictDialog: DialogBase<undefined> | undefined = $state();
  let deleteDialog: DialogBase<undefined> | undefined = $state();
  onMount(() => {
    void controller.loaded.then(async () => {
      try {
        if ($status.record?.remoteVersion) await cacheAccountGraph(owner, id, session);
      } catch {
        error =
          'Some linked sheets could not be checked. Cached drafts are kept; verify companions before relying on this browser for a complete backup.';
      }
      await saveGroup();
    });
    return () => controller.dispose();
  });
  async function saveGroup() {
    let unsaved: string[] = [];
    try {
      unsaved = await saveCachedCompanions(owner, id, session);
    } catch (caught) {
      error =
        caught instanceof Error
          ? caught.message
          : 'Linked drafts could not be checked. They remain in this browser.';
    }
    await controller.flush();
    if (unsaved.length)
      error = `Companion drafts waiting to save: ${unsaved.join(', ')}. Open them from your character library to review their storage status.`;
  }
  async function perform(fn: () => Promise<void>) {
    if (busy) return;
    busy = true;
    error = '';
    try {
      await fn();
    } catch (caught) {
      error =
        caught instanceof Error ? caught.message : 'The operation failed. Your draft is kept.';
      void notice?.open();
    } finally {
      busy = false;
    }
  }
  async function review() {
    await perform(async () => {
      preview = await controller.review();
      void conflictDialog?.open();
    });
  }
  async function choose(choice: 'reload' | 'replace') {
    const selected = preview;
    if (!selected) return;
    await perform(async () => {
      await controller.resolve(choice, selected);
      conflictDialog?.close();
    });
  }
  async function exportFile() {
    await perform(async () => {
      const result = await accountBundle(owner, id, undefined, controller.snapshot());
      if (!canReadAccount(session, owner))
        throw new Error('The account changed. Open this sheet with its owner to export it.');
      download(JSON.stringify(result.bundle, null, 2), 'brighter-worlds-account-character.json');
      if (result.warnings.length) error = result.warnings.join(' ');
    });
  }
  async function privateFile() {
    if (
      !confirm(
        'This private archive includes original settings and may contain Discord webhooks. Keep it private. Download it?',
      )
    )
      return;
    await perform(async () => {
      const json = await privateRecoveryFile(
        undefined,
        undefined,
        undefined,
        [
          {
            key: accountKey(owner, id),
            value: { ...$status.record, character: controller.snapshot() },
          },
        ],
        owner,
      );
      if (!canReadAccount(session, owner))
        throw new Error('The account changed. Open this sheet with its owner to export it.');
      download(json, 'brighter-worlds-private-recovery.json');
    });
  }
</script>

<svelte:window ononline={() => perform(saveGroup)} />

<StorageMenu
  icon="cloud"
  label="Account sheet"
  message={$status.accessible ? error || $status.message : $status.message}
  phase={$status.accessible && error ? 'error' : $status.phase}
>
  {#if $status.phase === 'conflict'}<MenuAction
      label="Review both copies…"
      icon="info"
      disabled={busy}
      action={() => {
        void review();
      }}
    />{/if}
  <MenuAction
    label="Save now"
    icon="upload"
    disabled={busy || !$status.accessible}
    action={() => {
      void perform(saveGroup);
    }}
  />
  <MenuAction
    label="Check account"
    icon="cloud"
    disabled={busy}
    action={() => {
      void perform(() => controller.refresh());
    }}
  />
  {#if $status.accessible}
    <MenuAction
      label="Download backup"
      icon="download"
      disabled={busy}
      action={() => {
        void exportFile();
      }}
    />
    <MenuAction
      label="Keep a local copy"
      icon="desktop"
      disabled={busy}
      action={() => {
        void perform(async () => {
          const local = await keepAccountLocally(owner, id, controller.snapshot());
          localHref = resolve('/character/[id]', { id: local });
          void notice?.open();
        });
      }}
    />
    <MenuAction
      label="Save a linked duplicate…"
      icon="nav-new-char"
      disabled={busy}
      action={() => {
        void duplicate?.open();
      }}
    />
    {#if $status.phase === 'error'}<MenuAction
        label="Private recovery archive…"
        icon="download"
        disabled={busy}
        action={() => {
          void privateFile();
        }}
      />{/if}
    {#if $status.record?.remoteVersion}<MenuAction
        label="Delete online copy…"
        destructive
        disabled={busy}
        action={() => {
          void deleteDialog?.open();
        }}
      />{/if}
  {/if}
</StorageMenu>
{#if $status.accessible}<SaveOnline
    bind:this={duplicate}
    {id}
    {cache}
    {owner}
    snapshot={() => controller.snapshot()}
    hideTrigger
  />{/if}
<DialogBase
  bind:this={notice}
  title={localHref && !error ? 'Local copy ready' : 'Sheet storage'}
  titleClass="font-title text-3xl"
>
  {#if $status.accessible}
    {#if error}<p role="alert" class="mt-4">{error}</p>{/if}
    {#if localHref}<Button class="mt-4" href={localHref}>Open local copy</Button>{/if}
  {:else}<p class="mt-4">Sign in to this sheet’s account to view its storage details.</p>{/if}
</DialogBase>
<DialogBase
  bind:this={conflictDialog}
  title="Choose which copy to keep"
  titleClass="font-title text-3xl text-center"
  maxWidth="max-w-2xl"
>
  {#if preview && $status.accessible}
    <div class="mt-5 grid gap-4 sm:grid-cols-2">
      <div class="space-y-2">
        <h3 class="font-subtitle text-2xl">Your draft</h3>
        <p>{controller.snapshot().name}</p>
        <p>Grit: {controller.snapshot().grit.current}</p>
        <p class="max-h-48 overflow-auto whitespace-pre-wrap">
          {controller.snapshot().notes || 'No notes'}
        </p>
      </div>
      <div class="space-y-2">
        <h3 class="font-subtitle text-2xl">Online copy · version {preview.remote.version}</h3>
        <p>{preview.remote.data.character.name}</p>
        <p>Grit: {preview.remote.data.character.grit.current}</p>
        <p class="max-h-48 overflow-auto whitespace-pre-wrap">
          {preview.remote.data.character.notes || 'No notes'}
        </p>
      </div>
    </div>
    <p class="mt-4">
      Download both copies to compare all inventory, abilities and other details. Replaced drafts
      are also archived in private local recovery.
    </p>
    <div class="mt-3 flex flex-wrap gap-2">
      <Button variant="outline" onclick={exportFile}>Download your draft</Button><Button
        variant="outline"
        onclick={() =>
          download(
            JSON.stringify(preview!.remote.data, null, 2),
            'brighter-worlds-online-version.json',
          )}>Download online version</Button
      >
    </div>
  {/if}
  {#if error && $status.accessible}<p role="alert" class="mt-3 text-red-700 dark:text-red-300">
      {error}
    </p>{/if}
  {#snippet footer()}<div class="mt-5 flex flex-wrap gap-2">
      <Button disabled={busy || !$status.accessible} onclick={() => choose('reload')}
        >Use online copy</Button
      ><Button
        variant="outline"
        disabled={busy || !$status.accessible}
        onclick={() => choose('replace')}>Replace this online version</Button
      ><Button variant="ghost" disabled={busy} onclick={() => conflictDialog?.close()}
        >Keep deciding</Button
      >
    </div>{/snippet}
</DialogBase>
<DialogBase
  bind:this={deleteDialog}
  title="Delete online copy?"
  titleClass="font-title text-3xl text-center"
>
  <p class="mt-5">
    This removes the account document on every device. This browser’s draft is kept in private
    recovery. Independent local sheets are not removed.
  </p>
  {#if error && $status.accessible}<p role="alert" class="mt-3 text-red-700 dark:text-red-300">
      {error}
    </p>{/if}
  {#snippet footer()}<div class="mt-5 flex gap-2">
      <Button
        variant="destructive"
        disabled={busy || !$status.accessible}
        onclick={() =>
          perform(async () => {
            await controller.deleteOnline();
            deleteDialog?.close();
          })}>Delete online copy</Button
      ><Button variant="ghost" disabled={busy} onclick={() => deleteDialog?.close()}>Cancel</Button>
    </div>{/snippet}
</DialogBase>
