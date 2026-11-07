<script lang="ts">
  import { onMount } from 'svelte';
  import { resolve } from '$app/paths';
  import SheetTransferContent from '$lib/SheetTransferContent.svelte';
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
  <SheetTransferContent
    {view}
    {error}
    bind:policy
    charactersHref={resolve('/character')}
    oncopy={save}
    onrestart={open}
    onfile={() => {
      dialog?.close();
      onfile();
    }}
    ondownload={() => {
      if (view?.prepared)
        download(view.prepared.originalText, 'brighter-worlds-selected-sheets.json');
    }}
  />
  {#snippet footer()}
    <div class="flex justify-end border-t border-purple-200 pt-4 dark:border-purple-800">
      <Button variant="ghost" disabled={view?.phase === 'saving'} onclick={() => dialog?.close()}
        >Close</Button
      >
    </div>
  {/snippet}
</DialogBase>
