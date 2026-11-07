<script lang="ts">
  import { onMount } from 'svelte';
  import { resolve } from '$app/paths';
  import { page } from '$app/state';
  import Button from '$lib/ui/button.svelte';
  import SheetBackups from '$lib/SheetBackups.svelte';
  import SheetRecovery from '$lib/SheetRecovery.svelte';
  import SheetTransfer from '$lib/SheetTransfer.svelte';
  import MigrationSheetPicker from '$lib/MigrationSheetPicker.svelte';
  import { createSheetCache, getSheetCache } from '$lib/data/sheet-manager';
  import { download } from '$lib/util/download';
  import {
    exportTransferSelection,
    SourceTransfer,
    transferSheets,
  } from '$lib/data/sheet-transfer/source';
  import { OLD_ORIGIN, ROOT_ORIGIN, validSession } from '$lib/data/sheet-transfer/protocol';
  import type { SheetBundleV1 } from '$lib/data/sheet-format/types';

  let oldSite = $derived(page.url.origin === OLD_ORIGIN);
  createSheetCache();
  const cache = getSheetCache();
  let backups: SheetBackups | undefined = $state();
  async function restored() {
    // The character library loads the restored records when it is next opened.
  }
  let summaries: Awaited<ReturnType<typeof transferSheets>>['summaries'] = $state.raw([]);
  let selected: string[] = $state([]);
  let warnings: string[] = $state([]);
  let error = $state('');
  let busy = $state(false);
  let backup: { json: string; bundle: SheetBundleV1 } | undefined = $state.raw();
  let view = $state.raw<ReturnType<typeof snapshot>>();
  let connection: SourceTransfer | undefined;
  let timer: ReturnType<typeof setInterval> | undefined;
  let disposed = false;
  function snapshot() {
    if (!connection) return undefined;
    return {
      phase: connection.phase,
      error: connection.error,
      ended: connection.ended,
      outcomes: [...connection.outcomes],
    };
  }
  function stop() {
    connection?.cancel();
    view = snapshot();
    clearInterval(timer);
  }
  async function perform(action: () => Promise<void>) {
    if (busy) return;
    busy = true;
    error = '';
    try {
      await action();
    } catch (caught) {
      error = caught instanceof Error ? caught.message : 'The selected sheets could not be read.';
    } finally {
      busy = false;
    }
  }
  async function prepareSelection(copy: boolean) {
    await perform(async () => {
      const result = await exportTransferSelection([...selected]);
      if (disposed) return;
      backup = { json: result.json, bundle: result.payload as SheetBundleV1 };
      warnings = [...new Set([...warnings, ...result.warnings])];
      if (copy) await connection?.offer(result.json);
      else download(result.json, 'brighter-worlds-selected-sheets.json');
    });
  }
  function receive(event: MessageEvent) {
    try {
      connection?.receive(event);
    } catch {
      connection?.fail('The connection was interrupted. Download the selected backup instead.');
    }
  }
  onMount(() => {
    if (!oldSite) return;
    const session = window.location.hash.slice(1);
    if (window.opener && validSession(session)) {
      connection = new SourceTransfer(window.opener, session, () => {
        view = snapshot();
      });
      view = snapshot();
      timer = setInterval(() => connection?.tick(), 1000);
    }
    void perform(async () => {
      const inventory = await transferSheets();
      if (disposed) return;
      summaries = inventory.summaries;
      selected = summaries.map((sheet) => sheet.id);
      warnings = inventory.warnings;
    });
    return () => {
      disposed = true;
      stop();
    };
  });
</script>

<svelte:window onmessage={receive} onpagehide={stop} />
<svelte:head><title>Find and copy your characters :: Brighter Worlds Online</title></svelte:head>
<main class="mx-auto max-w-2xl space-y-5 px-5 py-8 sm:px-8">
  <h1 class="font-title text-4xl">Take your adventurers with you</h1>
  <p>
    Brighter Worlds now has its home at brighterworlds.app. Sheets saved on the old dev site and on
    the main site live in separate browser storage. Open the source site in the original browser and
    profile; this site cannot find sheets on another device or in another profile.
  </p>
  <div class="flex flex-wrap gap-3">
    <Button variant="outline" href={resolve('/character')}>Characters on this site</Button>
    <Button variant="outline" onclick={() => backups?.open()}>Backups and recovery</Button>
  </div>
  {#if !oldSite}
    <p class="text-base text-gray-600 dark:text-gray-300">
      Saved your sheets at brighterworlds.app before? Open Characters on this site in that original
      browser and profile. Those sheets do not need a transfer from dev.
    </p>
  {/if}
  <SheetRecovery {cache} />
  {#if oldSite}
    <h2 class="font-subtitle text-3xl">Copy without an account</h2>
    <p>
      All readable local sheets are selected below. Uncheck any you do not want to copy. Companion
      sheets are included automatically. No account is needed, and your originals stay here.
    </p>
    {#if (!view || view.ended) && view?.phase !== 'finished'}
      <p
        role={view?.error ? 'alert' : undefined}
        class="rounded-xl bg-purple-100 p-4 dark:bg-purple-950"
      >
        {view?.error ||
          'For a direct copy, open your character library on brighterworlds.app and choose “Find sheets from the old site”. You can also download a backup here.'}
      </p>
    {:else if view.phase === 'connecting'}<p role="status">Waiting for the new-site window…</p>
    {:else if view.phase === 'offered' || view.phase === 'sending'}<p role="status">
        Sending your selected sheets…
      </p>
    {:else if view.phase === 'review'}<p role="status">
        Confirm the copy in the brighterworlds.app window.
      </p>{/if}
    {#if view?.phase !== 'finished'}
      {#if busy && !summaries.length}<p role="status">Reading local sheets…</p>
      {:else}
        <MigrationSheetPicker
          sheets={summaries}
          bind:selected
          disabled={busy || (!!view && !view.ended && view.phase !== 'selecting')}
          canCopy={view?.phase === 'selecting' && !view.ended}
          oncopy={() => prepareSelection(true)}
          ondownload={() => prepareSelection(false)}
        />
      {/if}
    {/if}
    {#if busy}<p role="status">Preparing your sheets…</p>{/if}
    {#if error}<p role="alert" class="text-red-700 dark:text-red-300">{error}</p>{/if}
    {#if warnings.length}<ul
        class="list-inside list-disc text-base text-amber-800 dark:text-amber-200"
      >
        {#each warnings as warning (warning)}<li>{warning}</li>{/each}
      </ul>{/if}
    {#if view?.phase === 'finished'}
      <p role="status">The new site confirmed these results. Your originals are still here.</p>
      <ul class="space-y-2 text-base">
        {#each view.outcomes as outcome (outcome.id)}
          <li>
            {backup?.bundle.sheets.find((sheet) => sheet.id === outcome.id)?.character.name ||
              outcome.id} — {outcome.outcome === 'restored'
              ? 'copied'
              : outcome.outcome === 'already-present'
                ? 'already present; unchanged'
                : outcome.outcome === 'already-processed'
                  ? 'this transfer was already applied; nothing changed'
                  : 'conflict skipped; current copy kept'}
          </li>
        {/each}
      </ul>
    {/if}
  {:else}
    <section class="space-y-3 rounded-2xl bg-purple-100 p-5 dark:bg-purple-950">
      <h2 class="font-subtitle text-3xl">Copy directly from the old site</h2>
      <p>
        This is the quickest path in the same browser and profile. Open the old site in a pop-up,
        uncheck any sheets you do not want, then confirm the copy here. Companion sheets are
        included. No account is needed, and originals stay on the old site.
      </p>
      {#if page.url.origin === ROOT_ORIGIN}
        <SheetTransfer onrestore={restored} onfile={() => backups?.open()} />
      {:else}
        <Button href={`${ROOT_ORIGIN}/migrate`}>Start at brighterworlds.app</Button>
      {/if}
      <p class="text-base">
        If the pop-up is blocked or loses its connection, use the file route below.
      </p>
    </section>
  {/if}
  <section class="space-y-3 border-t border-purple-200 pt-5 dark:border-purple-800">
    <h2 class="font-subtitle text-3xl">Move with a file</h2>
    <p>No account is needed. This also works across browsers or devices.</p>
    <ol class="list-decimal space-y-2 pl-6">
      <li>
        Open the source site in the browser and profile that holds your sheets. Use Backups and
        recovery to download local characters, or a game backup for your GM data too.
      </li>
      <li>
        At brighterworlds.app, open Backups and recovery and choose your downloaded file. The entire
        file is validated before you review the characters, companions and GM categories.
      </li>
      <li>
        Restore the backup, review every result, and open your characters and companions to check
        them. Keep the original file and source copies until you have checked everything.
      </li>
    </ol>
    <div class="flex flex-wrap gap-3">
      {#if !oldSite}<Button variant="outline" href={`${OLD_ORIGIN}/migrate`}
          >Open old-site export</Button
        >{/if}
      <Button variant="outline" onclick={() => backups?.open()}
        >Back up or restore on this site</Button
      >
    </div>
  </section>
  <section class="space-y-3 border-t border-purple-200 pt-5 dark:border-purple-800">
    <h2 class="font-subtitle text-3xl">Use your ttrpg.tools account</h2>
    <ol class="list-decimal space-y-2 pl-6">
      <li>
        On the source site, sign in and open a local character. Choose Save online from its storage
        menu. Signing in alone does not upload your local sheets.
      </li>
      <li>
        Review the selected character and its linked companions. Wait for every sheet to show Saved
        online. A duplicate ID alone does not confirm a matching copy. If only some sheets save,
        keep the originals, review each result and use Retry transfer after resolving the reported
        problem.
      </li>
      <li>
        Open brighterworlds.app and sign in to the same account there. Sign-ins are separate on each
        site. Check the characters and companions in your account library before relying on that
        copy. Local recovery copies are kept on the source site.
      </li>
    </ol>
    <p class="text-base">
      Account saving currently supports characters and companions with image URLs. Sheets with
      embedded images or missing companions need a file backup or recovery first. GM data needs a
      game backup; it is not saved to your account.
    </p>
    <Button variant="outline" href={resolve('/character')}
      >Open this site’s character library</Button
    >
  </section>
  <details class="space-y-3 border-t border-purple-200 pt-5 dark:border-purple-800">
    <summary class="cursor-pointer font-subtitle text-2xl"
      >Existing copies and interrupted transfers</summary
    >
    <p>
      If both sites have sheets with the same ID, matching content can remain unchanged after
      verification. When copies differ, <strong>Keep both</strong> copies the selected sheets with new
      IDs and adds “(copy)” to their names. Companion sheets remain connected, and existing sheets are
      kept. Skipping conflicts keeps the current copies; skipped records have not been copied.
    </p>
    <p>
      Review results for every record. A failed save or lost connection is not confirmation of a
      completed transfer. Retry the same selection or backup; verified receipts prevent it from
      being applied twice. An “already applied” result refers to that earlier transfer, so check
      your current destination sheets too. Make another copy only when you intend to keep an
      additional copy.
    </p>
  </details>
  <details class="space-y-3 border-t border-purple-200 pt-5 dark:border-purple-800">
    <summary class="cursor-pointer font-subtitle text-2xl">What a game backup includes</summary>
    <p>
      A game backup includes local characters and companions, custom NPCs and relics, encounters,
      the playmat, scenes, custom tables, friends, the GM roll log and player activity log. Existing
      GM categories are kept unless you explicitly choose to replace them during restore.
    </p>
    <p>
      Review backup warnings for damaged or unsupported records. Private Discord settings and
      sign-in details are excluded. Embedded images are included when supported; image URLs remain
      links to their original hosts. Account sheets need their own character or group download.
    </p>
  </details>
  <section class="space-y-3 rounded-2xl border border-purple-300 p-5 dark:border-purple-700">
    <h2 class="font-subtitle text-3xl">Need to recover a sheet?</h2>
    <p>
      You can keep using local sheets, deep links and backups on dev.brighterworlds.app. Account
      sign-in or online storage failures do not require you to leave the source site. Direct copy
      and file backups work without those services.
    </p>
    <p>
      If browser storage fails or a record cannot be read, keep the original tab open. Open Backups
      and recovery → Advanced recovery to download a private archive of readable originals. Review
      its warnings and keep it private; it may include Discord webhooks and needs manual recovery
      rather than ordinary file restore. Keep an open edited sheet available for its own backup if
      saving has failed.
    </p>
    <Button variant="outline" onclick={() => backups?.open()}>Open recovery tools</Button>
  </section>
  <div class="flex flex-wrap gap-4 text-base underline">
    <a href="https://brighterworlds.app/character">Open brighterworlds.app characters</a>
    <a href="https://dev.brighterworlds.app/character">Open old-site characters</a>
    <a href={resolve('/')}>Home on this site</a>
  </div>
</main>
<SheetBackups bind:this={backups} {cache} onrestore={restored} />
