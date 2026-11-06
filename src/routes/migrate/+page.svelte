<script lang="ts">
  import { onMount } from 'svelte';
  import { resolve } from '$app/paths';
  import Button from '$lib/ui/button.svelte';
  import { download } from '$lib/util/download';
  import {
    exportTransferSelection,
    SourceTransfer,
    transferSheets,
  } from '$lib/data/sheet-transfer/source';
  import { OLD_ORIGIN, validSession } from '$lib/data/sheet-transfer/protocol';
  import type { SheetBundleV1 } from '$lib/data/sheet-format/types';

  let oldSite = $state(false);
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
  async function review() {
    await perform(async () => {
      const result = await exportTransferSelection([...selected]);
      if (disposed) return;
      backup = { json: result.json, bundle: result.payload as SheetBundleV1 };
      warnings = [...new Set([...warnings, ...result.warnings])];
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
    oldSite = window.location.origin === OLD_ORIGIN;
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
      warnings = inventory.warnings;
    });
    return () => {
      disposed = true;
      stop();
    };
  });
</script>

<svelte:window onmessage={receive} onpagehide={stop} />
<svelte:head><title>Copy your characters :: Brighter Worlds Online</title></svelte:head>
<main class="mx-auto max-w-2xl space-y-5 px-5 py-8 sm:px-8">
  <h1 class="font-title text-4xl">Take your adventurers with you</h1>
  {#if oldSite}
    <p>
      Choose local characters from this browser to copy to brighterworlds.app. Linked companions are
      included. No account is needed, and your originals stay here.
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
        Sending your selected backup…
      </p>
    {:else if view.phase === 'review'}<p role="status">
        Review the sheets in the brighterworlds.app window and confirm the copy there.
      </p>{/if}
    {#if !backup}
      <fieldset disabled={busy} class="space-y-3">
        <legend class="mb-3 font-subtitle text-2xl">Choose characters</legend>
        <div class="max-h-96 space-y-2 overflow-y-auto">
          {#each summaries as sheet (sheet.id)}
            <label
              class="flex cursor-pointer items-start gap-3 rounded-xl border border-purple-200 p-3 dark:border-purple-800"
            >
              <input type="checkbox" bind:group={selected} value={sheet.id} class="mt-1" />
              <span class="min-w-0 break-words">
                <strong>{sheet.name || 'Unnamed character'}</strong>
                <span class="block text-base text-gray-600 dark:text-gray-300">
                  {sheet.calling || 'No Calling'}{sheet.companions
                    ? ` · ${sheet.companions} companion link(s)`
                    : ''}
                </span>
              </span>
            </label>
          {:else}<p>
              {busy
                ? 'Reading local sheets…'
                : 'No readable local sheets were found. Check that this is the browser and profile you used before.'}
            </p>{/each}
        </div>
        <Button disabled={busy || !selected.length} onclick={review}>Review selected sheets</Button>
      </fieldset>
    {:else}
      <section class="space-y-3" aria-labelledby="selection-heading">
        <h2 id="selection-heading" class="font-subtitle text-2xl">
          Selected sheets and companions
        </h2>
        <ul class="max-h-64 list-inside list-disc overflow-y-auto text-base">
          {#each backup.bundle.sheets as sheet (sheet.id)}
            <li>
              {sheet.character.name || 'Unnamed character'}{backup.bundle.roots.includes(sheet.id)
                ? ''
                : ' (linked companion)'}
            </li>
          {/each}
        </ul>
        <p class="text-base">
          These sheets include their notes, equipment and images. Private settings such as Discord
          webhooks are excluded. You will review any existing copies on the new site before saving.
        </p>
        <div class="flex flex-wrap gap-3">
          {#if view?.phase === 'selecting' && !view.ended}
            <Button
              disabled={busy}
              onclick={() => perform(async () => connection?.offer(backup!.json))}
              >Copy to brighterworlds.app</Button
            >
          {/if}
          <Button
            variant="outline"
            onclick={() => download(backup!.json, 'brighter-worlds-characters.json')}
            >Download selected backup</Button
          >
          {#if !view || view.phase === 'selecting' || view.ended}<Button
              variant="ghost"
              disabled={busy}
              onclick={() => {
                backup = undefined;
              }}>Change selection</Button
            >{/if}
        </div>
      </section>
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
    <p class="border-t border-purple-200 pt-4 text-base dark:border-purple-800">
      If some sheets need recovery, <a href={resolve('/character')} class="underline"
        >open your local library</a
      >
      and use Backups and restore → Advanced recovery. Restore a downloaded character backup from Backups
      and restore on the new site. Account characters are already in your account library.
    </p>
  {:else}
    <p>Open the old site in the browser and profile that holds your characters.</p>
    <Button href="https://dev.brighterworlds.app/migrate">Open old-site export</Button>
  {/if}
  <a class="inline-block underline" href="https://brighterworlds.app/character"
    >Open brighterworlds.app</a
  >
</main>
