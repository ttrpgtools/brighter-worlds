<script lang="ts" module>
  import type { DestinationTransfer } from '$lib/data/sheet-transfer/destination';
  export type TransferView = Pick<
    DestinationTransfer,
    'phase' | 'ended' | 'error' | 'prepared' | 'outcomes'
  >;
</script>

<script lang="ts">
  import Button from '$lib/ui/button.svelte';
  import type { CollisionPolicy } from '$lib/data/sheet-backup';

  let {
    view,
    error = '',
    policy = $bindable('copy'),
    charactersHref,
    oncopy,
    onrestart,
    onfile,
    ondownload,
  }: {
    view?: TransferView;
    error?: string;
    policy: CollisionPolicy;
    charactersHref: string;
    oncopy: () => void;
    onrestart: () => void;
    onfile: () => void;
    ondownload: () => void;
  } = $props();
  const conflicts = $derived(view?.prepared?.statuses.some((sheet) => sheet.state === 'conflict'));
  const makingCopies = $derived(conflicts && policy === 'copy');
  const finished = $derived(view?.phase === 'finished' && !!view.outcomes.length);
</script>

<div class="mt-5 space-y-4" aria-busy={view?.phase === 'saving'}>
  {#if !finished}
    <p>
      Choose your sheets in the old-site window, then confirm the copy here. No account is needed.
      Your originals stay on the old site.
    </p>
  {/if}
  {#if error || view?.error}
    <p role="alert" class="text-red-700 dark:text-red-300">{error || view?.error}</p>
  {/if}
  {#if !view?.ended}
    {#if view?.phase === 'connecting'}<p role="status">Connecting to the old site…</p>
    {:else if view?.phase === 'selecting'}<p role="status">
        Choose your sheets in the old-site window and click “Copy selected sheets to
        brighterworlds.app”.
      </p>
    {:else if view?.phase === 'receiving'}<p role="status">Receiving your sheets…</p>
    {:else if view?.phase === 'validating'}<p role="status">Checking your sheets…</p>
    {:else if view?.phase === 'saving'}<p role="status">Saving and verifying your sheets…</p>{/if}
  {/if}
  {#if view?.prepared && !view.outcomes.length}
    <section class="space-y-3 border-t border-purple-200 pt-4 dark:border-purple-800">
      <h3 class="font-subtitle text-2xl">Ready to copy</h3>
      <ul class="max-h-64 space-y-2 overflow-y-auto text-base">
        {#each view.prepared.statuses as sheet (sheet.id)}
          <li>
            <strong>{sheet.name || 'Unnamed character'}</strong> — {makingCopies
              ? sheet.state === 'conflict'
                ? 'a different version is already here; a new copy will be added'
                : sheet.state === 'same'
                  ? 'already here; another copy will be added'
                  : 'will be added as a new copy'
              : sheet.state === 'new'
                ? 'will be added'
                : sheet.state === 'same'
                  ? 'already here; unchanged'
                  : 'a different version is already here'}
          </li>
        {/each}
      </ul>
      {#each view.prepared.warnings as warning (warning)}
        <p class="text-base text-amber-800 dark:text-amber-200">{warning}</p>
      {/each}
      {#if conflicts}
        <label class="flex flex-col gap-1 text-base">
          What should happen to different versions?
          <select
            class="rounded border bg-transparent p-2"
            bind:value={policy}
            disabled={view.phase === 'saving' || view.ended}
          >
            <option value="copy">Keep both: copy with new IDs</option>
            <option value="skip">Keep existing sheets and skip conflicts</option>
          </select>
        </label>
        <p class="text-base">
          {#if policy === 'copy'}
            The selected sheets are copied with new IDs and “(copy)” added to their names. Companion
            sheets stay connected to the correct character. Existing sheets are kept.
          {:else}
            Different versions are skipped, and existing sheets are kept. Any new sheets will still
            be added.
          {/if}
        </p>
      {/if}
      <Button disabled={view.phase !== 'preview' || view.ended} onclick={oncopy}
        >{view.error ? 'Retry copying these sheets' : 'Copy these sheets'}</Button
      >
    </section>
  {/if}
  {#if finished}
    <section class="space-y-3" aria-labelledby="copy-results-heading">
      <h3 id="copy-results-heading" class="font-subtitle text-2xl">Copy complete</h3>
      <p role="status">
        Results for each sheet are below. Your originals are still on the old site.
      </p>
      <ul class="max-h-64 space-y-2 overflow-y-auto text-base">
        {#each view!.outcomes as outcome (outcome.id)}
          <li>
            <strong>{outcome.name || 'Unnamed character'}</strong> — {outcome.outcome === 'restored'
              ? 'copied'
              : outcome.outcome === 'already-processed'
                ? 'processed in an earlier copy; no changes made'
                : outcome.outcome === 'already-present'
                  ? 'already here; unchanged'
                  : 'skipped; existing sheet kept'}
          </li>
        {/each}
      </ul>
      <Button href={charactersHref}>View characters</Button>
    </section>
  {/if}
  {#if !finished && (!view || view.ended)}
    <Button class="max-w-full whitespace-normal" variant="outline" onclick={onrestart}
      >Reconnect to the old site</Button
    >
  {/if}
  {#if view?.prepared}
    <details class="space-y-3 border-t border-purple-200 pt-4 dark:border-purple-800">
      <summary class="cursor-pointer font-subtitle text-2xl">Save a backup file</summary>
      <p class="text-base">
        Save the sheets selected on the old site as a backup file on this device. You can restore
        this file later or use it in another browser.
      </p>
      <Button class="max-w-full whitespace-normal" variant="outline" onclick={ondownload}
        >Download selected sheets as a backup</Button
      >
    </details>
  {/if}
  {#if !finished && (!view?.prepared || view.ended)}
    <section class="space-y-3 border-t border-purple-200 pt-4 dark:border-purple-800">
      <h3 class="font-subtitle text-2xl">Copy using a file instead</h3>
      <p class="text-base">
        If the windows cannot connect, <a
          class="underline"
          href="https://dev.brighterworlds.app/migrate"
          target="_blank"
          rel="noopener noreferrer">open the old site</a
        > and download your sheets as a backup. Then open the backup tools here and choose that file.
      </p>
      <Button variant="outline" disabled={view?.phase === 'saving'} onclick={onfile}
        >Open backup tools</Button
      >
    </section>
  {/if}
</div>
