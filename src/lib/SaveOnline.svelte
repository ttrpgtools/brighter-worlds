<script lang="ts">
  import DialogBase from '$lib/DialogBase.svelte';
  import Button from '$lib/ui/button.svelte';
  import { goto } from '$app/navigation';
  import { getList } from '$lib/data/sheet-manager';
  import { resolve } from '$app/paths';
  import { getAccountSession, canReadAccount } from '$lib/data/account-session';
  import {
    prepareOnlineSelection,
    prepareAccountSelection,
    saveOnlineSelection,
    type OnlineSelection,
  } from '$lib/data/account-transfer';
  import type { SheetCache } from '$lib/data/sheet-manager';
  import type { Character } from '$lib/types';
  let {
    id,
    cache,
    owner,
    snapshot,
    hideTrigger = false,
  }: {
    id: string;
    cache: SheetCache;
    owner?: string;
    snapshot?: () => Character;
    hideTrigger?: boolean;
  } = $props();
  const session = getAccountSession();
  const list = getList();
  let dialog: DialogBase<undefined> | undefined = $state();
  let selection: OnlineSelection | undefined = $state.raw();
  let result: Awaited<ReturnType<typeof saveOnlineSelection>> | undefined = $state.raw();
  let busy = $state(false);
  let error = $state('');
  let nonce: string | undefined;
  export async function open() {
    void dialog?.open();
    busy = true;
    error = '';
    result = undefined;
    selection = undefined;
    nonce = owner ? crypto.randomUUID() : undefined;
    try {
      await session.refresh();
      if (owner && !canReadAccount(session, owner))
        throw new Error('Sign in to this sheet’s owner before preparing a duplicate.');
      const prepared = owner
        ? await prepareAccountSelection(owner, id, snapshot?.())
        : await prepareOnlineSelection(id, cache);
      if (owner && !canReadAccount(session, owner))
        throw new Error('The account changed. Reopen this sheet with its owner.');
      selection = prepared;
    } catch (caught) {
      error =
        caught instanceof Error ? caught.message : 'The selected sheets could not be prepared.';
    } finally {
      busy = false;
    }
  }
  async function save() {
    if (!selection || busy) return;
    busy = true;
    error = '';
    try {
      result = await saveOnlineSelection(selection, session, {
        nonce,
        expectedOwner: owner ?? session.current().account?.user?.id,
      });
      if (!owner && result.promoted) {
        const ids = new Set(result.outcomes.map((item) => item.original));
        list.update((current) => current?.filter((sheet) => !ids.has(sheet.id)));
        await goto(
          resolve(`/character/[id]?account=${encodeURIComponent(result.owner)}`, {
            id: result.outcomes.find((item) => item.original === id)!.id,
          }),
          { replaceState: true },
        );
      }
    } catch (caught) {
      error =
        caught instanceof Error ? caught.message : 'Saving failed. Your local sheets are kept.';
    } finally {
      busy = false;
    }
  }
</script>

{#if !hideTrigger}<Button variant="outline" disabled={busy} onclick={open}
    >{owner ? 'Save a linked duplicate' : 'Save online'}</Button
  >
{/if}
<DialogBase
  bind:this={dialog}
  preventDismiss={busy}
  title="Save sheets online"
  titleClass="font-title text-3xl text-center"
  maxWidth="max-w-xl"
>
  <div class="mt-5 space-y-4" aria-busy={busy}>
    <p>
      {#if owner}Create a separate linked duplicate in your account.
      {:else}Save this character and its companions to your account. They become account characters,
        with an offline cache in this browser. Recovery archives preserve their original local
        records.{/if}
    </p>
    <p>Discord webhooks and sign-in details are never uploaded.</p>
    {#if !$session.account?.user}
      <Button href={resolve('/auth/login')} data-sveltekit-reload>Sign in to save online</Button>
    {:else if !$session.account.allowed}
      <p role="alert">
        This account cannot currently use online storage. Local sheets and file backups remain
        available.
      </p>
    {/if}
    {#if selection}
      <ul class="list-inside list-disc">
        {#each selection.bundle.sheets as sheet (sheet.id)}<li>
            {sheet.character.name || 'Unnamed character'}
          </li>{/each}
      </ul>
      {#if selection.bundle.assets.length}<p
          role="alert"
          class="text-amber-700 dark:text-amber-300"
        >
          This group contains embedded images. Online saving currently supports image URLs. Download
          a file backup to preserve these images; nothing has been removed.
        </p>{/if}
      {#if selection.bundle.unresolvedRelations.length}<p
          role="alert"
          class="text-amber-700 dark:text-amber-300"
        >
          Some companion sheets are missing. Recover them or remove their broken links before saving
          this group online.
        </p>{/if}
      {#if selection.warnings.length}<ul
          class="list-inside list-disc text-amber-700 dark:text-amber-300"
        >
          {#each selection.warnings as warning (warning)}<li>{warning}</li>{/each}
        </ul>{/if}
      <p class="text-sm">
        {owner
          ? 'The duplicate has its own identity.'
          : 'If an existing account character differs, it is preserved separately.'} Retrying an interrupted
        save resumes its progress.
      </p>
    {/if}
    {#if busy}<p role="status">Working with your account sheets…</p>{/if}
    {#if error}<p role="alert" class="text-red-700 dark:text-red-300">{error}</p>{/if}
    {#if result}
      <ul class="space-y-2" aria-label="Online save results">
        {#each result.outcomes as item (item.id)}<li>
            <strong>{item.name}</strong>: {item.message}
          </li>{/each}
      </ul>
      {#if result.copied}<p>
          The character and its companion sheets were copied separately to keep existing account
          sheets safe.
        </p>{/if}
      {#if result.complete}
        {#if !owner && !result.promoted}<p role="alert">
            The local draft changed during saving. Both versions have been kept; review the local
            changes before continuing.
          </p>{/if}
        <Button href={result.href}>Open character</Button>
      {:else}<p>
          Some sheets are still waiting to save. Their drafts and transfer progress are kept in this
          browser. Retry after resolving the reported problem.
        </p>{/if}
    {/if}
  </div>
  {#snippet footer()}
    <div class="mt-5 flex flex-wrap gap-3">
      <Button
        disabled={busy ||
          !selection ||
          !!selection.bundle.assets.length ||
          !!selection.bundle.unresolvedRelations.length ||
          !$session.account?.allowed}
        onclick={save}
        >{result
          ? 'Retry transfer'
          : `Save ${selection?.bundle.sheets.length ?? ''} ${selection?.bundle.sheets.length === 1 ? 'sheet' : 'sheets'} online`}</Button
      >
      <Button variant="ghost" disabled={busy} onclick={() => dialog?.close()}>Close</Button>
    </div>
  {/snippet}
</DialogBase>
