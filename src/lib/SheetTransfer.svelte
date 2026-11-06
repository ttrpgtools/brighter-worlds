<script lang="ts">
  import { onMount } from 'svelte';
  import DialogBase from '$lib/DialogBase.svelte';
  import Button from '$lib/ui/button.svelte';
  import { DestinationTransfer } from '$lib/data/sheet-transfer/destination';
  import { ROOT_ORIGIN, transferURL } from '$lib/data/sheet-transfer/protocol';
  import type { CollisionPolicy } from '$lib/data/sheet-backup';
  import { download } from '$lib/util/download';

  let { onrestore, onfile }: { onrestore: () => Promise<void>; onfile: () => void } = $props();
  let available = $state(false);
  let dialog: DialogBase<undefined> | undefined = $state();
  let policy: CollisionPolicy = $state('copy');
  let error = $state('');
  let view = $state.raw<ReturnType<typeof snapshot>>();
  let connection: DestinationTransfer | undefined;
  let timer: ReturnType<typeof setInterval> | undefined;
  function snapshot() {
    if (!connection) return undefined;
    return {
      phase: connection.phase,
      ended: connection.ended,
      error: connection.error,
      prepared: connection.prepared,
      outcomes: connection.outcomes,
      received: connection.received,
      chunks: connection.inventory?.chunks ?? 0,
    };
  }
  function stop() {
    connection?.cancel();
    view = snapshot();
    connection = undefined;
    clearInterval(timer);
  }
  function open() {
    stop();
    error = '';
    policy = 'copy';
    view = undefined;
    const session = crypto.randomUUID();
    // Synchronous with the user's click so the browser can allow this popup.
    let popup: Window | null = null;
    try {
      popup = window.open(transferURL(session), '_blank', 'popup,width=680,height=820');
    } catch {
      // Browser privacy settings can reject window.open rather than return null.
    }
    void dialog?.open().then(stop);
    if (!popup) {
      error =
        'The pop-up was blocked. Allow pop-ups for this site and try again, or use a backup file.';
      return;
    }
    connection = new DestinationTransfer(popup, session, () => {
      view = snapshot();
    });
    view = snapshot();
    connection.tick();
    timer = setInterval(() => connection?.tick(), 1000);
  }
  function receive(event: MessageEvent) {
    void connection?.receive(event).catch(() => {
      connection?.fail('The connection was interrupted. Try again or use a backup file.');
    });
  }
  async function save() {
    const selected = connection;
    if (!selected) return;
    error = '';
    await selected.save(policy);
    if (selected.outcomes.length) {
      try {
        await onrestore();
      } catch {
        error = 'The sheets were saved. Reopen your character library to refresh the list.';
      }
    }
  }
  onMount(() => {
    available = window.location.origin === ROOT_ORIGIN;
    return stop;
  });
</script>

<svelte:window onmessage={receive} onpagehide={stop} />
{#if available}
  <Button variant="outline" onclick={open}>Find sheets from the old site</Button>
{/if}
<DialogBase
  bind:this={dialog}
  title="Copy sheets from the old site"
  titleClass="font-title text-3xl text-center"
  maxWidth="max-w-2xl"
  preventDismiss={view?.phase === 'saving'}
>
  <div class="mt-5 space-y-4" aria-busy={view?.phase === 'saving'}>
    <p>
      The old site opens in another window. Use the same browser and profile that holds your
      characters, choose what to copy, then review it here. No account is needed. Originals stay on
      the old site.
    </p>
    {#if error || view?.error}<p role="alert" class="text-red-700 dark:text-red-300">
        {error || view?.error}
      </p>{/if}
    {#if !view?.ended}
      {#if view?.phase === 'connecting'}<p role="status">Connecting to the old site…</p>
      {:else if view?.phase === 'selecting'}<p role="status">
          Choose and confirm your characters in the old-site window.
        </p>
      {:else if view?.phase === 'receiving'}<p role="status">
          Receiving backup: {view.received} of {view.chunks} parts…
        </p>
      {:else if view?.phase === 'validating'}<p role="status">Checking the complete backup…</p>
      {:else if view?.phase === 'saving'}<p role="status">Saving and verifying your sheets…</p>{/if}
    {/if}
    {#if view?.prepared && !view.outcomes.length}
      <section class="space-y-3 border-t border-purple-200 pt-4 dark:border-purple-800">
        <h3 class="font-subtitle text-2xl">Review before copying</h3>
        <ul class="max-h-64 space-y-2 overflow-y-auto text-base">
          {#each view.prepared.statuses as sheet (sheet.id)}
            <li>
              <strong>{sheet.name || 'Unnamed character'}</strong> — {sheet.state === 'new'
                ? 'new character'
                : sheet.state === 'same'
                  ? 'already present'
                  : 'a different copy or deletion exists'}
            </li>
          {/each}
        </ul>
        {#each view.prepared.warnings as warning (warning)}
          <p class="text-base text-amber-800 dark:text-amber-200">{warning}</p>
        {/each}
        <label class="flex flex-col gap-1 text-base">
          If characters differ
          <select
            class="rounded border bg-transparent p-2"
            bind:value={policy}
            disabled={view.phase === 'saving' || view.ended}
          >
            <option value="copy">Keep both: copy the linked group with new IDs</option>
            <option value="skip">Keep current copies and skip conflicts</option>
          </select>
        </label>
        <p class="text-base">Companion links are preserved together. Current sheets are kept.</p>
        <Button disabled={view.phase !== 'preview' || view.ended} onclick={save}
          >Copy to this browser</Button
        >
      </section>
    {/if}
    {#if view?.outcomes.length}
      <p role="status">Copy finished. Results below reflect verified saves.</p>
      <ul class="max-h-64 space-y-2 overflow-y-auto text-base">
        {#each view.outcomes as outcome (outcome.id)}
          <li>
            <strong>{outcome.name || 'Unnamed character'}</strong> — {outcome.outcome === 'restored'
              ? 'copied'
              : outcome.outcome === 'already-processed'
                ? 'this transfer was already applied; nothing changed'
                : outcome.outcome === 'already-present'
                  ? 'already present; unchanged'
                  : 'conflict skipped; current copy kept'}
          </li>
        {/each}
      </ul>
    {/if}
    <div class="space-y-3 border-t border-purple-200 pt-4 dark:border-purple-800">
      <h3 class="font-subtitle text-2xl">Use a file instead</h3>
      <p class="text-base">
        If the windows cannot connect, <a
          class="underline"
          href="https://dev.brighterworlds.app/migrate"
          target="_blank"
          rel="noopener noreferrer">open the old site's export page</a
        >, download a character backup, then choose it in Backups and restore here.
      </p>
      <div class="flex flex-wrap gap-2">
        {#if !view || view.ended}<Button variant="outline" onclick={open}>Try again</Button>{/if}
        {#if view?.prepared}<Button
            variant="outline"
            onclick={() =>
              download(view!.prepared!.originalText, 'brighter-worlds-transferred-characters.json')}
            >Download received backup</Button
          >{/if}
        <Button
          variant="outline"
          disabled={view?.phase === 'saving'}
          onclick={() => {
            dialog?.close();
            onfile();
          }}>Backups and restore</Button
        >
      </div>
    </div>
  </div>
  {#snippet footer()}
    <div class="flex justify-end border-t border-purple-200 pt-4 dark:border-purple-800">
      <Button variant="ghost" disabled={view?.phase === 'saving'} onclick={() => dialog?.close()}
        >Close</Button
      >
    </div>
  {/snippet}
</DialogBase>
