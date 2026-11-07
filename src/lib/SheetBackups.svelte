<script lang="ts">
  import {
    exportBackup,
    prepareBackup,
    restoreBackup,
    type PreparedBackup,
    type ImportOutcome,
    type CollisionPolicy,
  } from '$lib/data/sheet-backup';
  import type { SheetCache } from '$lib/data/sheet-manager';
  import { download } from '$lib/util/download';
  import { privateRecoveryFile } from '$lib/data/private-recovery';
  import DialogBase from '$lib/DialogBase.svelte';
  import Button, { buttonVariants } from '$lib/ui/button.svelte';
  import Icon from '$lib/ui/icon.svelte';
  import { getAccountSession } from '$lib/data/account-session';
  const session = getAccountSession();
  let dialog: DialogBase<undefined> | undefined = $state();
  let filename = $state('');
  export function open() {
    void dialog?.open();
  }
  let { cache, onrestore }: { cache: SheetCache; onrestore: () => Promise<void> } = $props();
  let busy = $state(false);
  let error = $state('');
  let message = $state('');
  let warnings: string[] = $state([]);
  let prepared: PreparedBackup | undefined = $state.raw();
  let outcomes: ImportOutcome[] = $state([]);
  let policy: CollisionPolicy = $state('copy');
  let replaceGame = $state(false);
  let newTransferId: string | undefined = $state();
  let lastPrepared: PreparedBackup | undefined = $state.raw();
  const labels: Record<string, string> = {
    'bw-gm-npcs': 'Custom NPCs',
    'bw-gm-relics': 'Custom relics',
    'bw-encounters': 'Encounters',
    'bw-playmat': 'Playmat',
    'bw-gm-scenes': 'Scenes',
    'bw-gm-tables': 'Custom tables',
    'bw-gm-friends': 'Friends',
    'bw-rolllog2': 'GM roll log',
    'bw-player-log': 'Player activity log',
  };
  const label = (key: string) => labels[key] ?? key;
  async function perform(action: () => Promise<void>) {
    if (busy) return;
    busy = true;
    error = '';
    message = '';
    try {
      await action();
    } catch (err) {
      error = err instanceof Error ? err.message : 'The operation failed. Existing data was kept.';
    } finally {
      busy = false;
    }
  }
  async function exportFile(game = false, ids?: string[]) {
    await perform(async () => {
      const result = await exportBackup({ game, ids, cache });
      warnings = result.warnings;
      download(
        result.json,
        game ? 'brighter-worlds-game-backup.json' : 'brighter-worlds-characters.json',
      );
      message = warnings.length
        ? 'Backup downloaded with warnings. Review the details below.'
        : 'Backup downloaded.';
    });
  }
  async function downloadPrivate() {
    if (
      !confirm(
        'This private archive may contain original Discord webhooks and private settings. It is for manual recovery, not sharing or ordinary restore. Keep it private. Download it?',
      )
    )
      return;
    await perform(async () => {
      const owner = session.current().account?.user?.id ?? session.current().offlineOwner;
      const json = await privateRecoveryFile(cache, undefined, undefined, [], owner);
      if ((session.current().account?.user?.id ?? session.current().offlineOwner) !== owner)
        throw new Error('The account changed. Prepare the recovery archive again.');
      warnings = JSON.parse(json).warnings;
      download(json, 'brighter-worlds-private-recovery.json');
      message =
        'Private recovery archive downloaded. Keep it private; it is not an ordinary portable backup.';
    });
  }
  export async function downloadCharacter(id: string) {
    await exportFile(false, [id]);
    if (error || warnings.length) open();
  }
  async function chooseFile(event: Event) {
    const input = event.currentTarget as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    filename = file.name;
    prepared = undefined;
    newTransferId = undefined;
    outcomes = [];
    warnings = [];
    await perform(async () => {
      if (file.size > 16 * 1024 * 1024) throw new Error('Backup files must be at most 16 MiB.');
      prepared = await prepareBackup(await file.text());
      warnings = prepared.warnings;
      policy = 'copy';
      replaceGame = false;
    });
  }
  async function restore() {
    const selected = prepared;
    if (!selected) return;
    await perform(async () => {
      outcomes = await restoreBackup(selected, policy, replaceGame, undefined, newTransferId);
      lastPrepared = selected;
      await onrestore();
      prepared = undefined;
      message = 'Restore finished. Results for each record are shown below.';
    });
  }
</script>

<DialogBase
  bind:this={dialog}
  title="Backups and restore"
  titleClass="font-title text-3xl text-center"
  maxWidth="max-w-2xl"
>
  <div class="mt-6 space-y-6" aria-busy={busy}>
    <section class="space-y-3" aria-labelledby="backup-download-heading">
      <h3 id="backup-download-heading" class="font-subtitle text-2xl">Download a backup</h3>
      <p>
        Local character backups include linked companions and images. A game backup also includes
        your GM libraries, encounters and activity logs. Discord settings stay in this browser.
      </p>
      <div class="flex flex-wrap gap-3">
        <Button icon="download" disabled={busy} onclick={() => exportFile()}
          >Back up local characters</Button
        >
        <Button variant="outline" icon="download" disabled={busy} onclick={() => exportFile(true)}
          >Download game backup</Button
        >
      </div>
    </section>
    <section
      class="space-y-3 border-t border-purple-200 pt-5 dark:border-purple-800"
      aria-labelledby="backup-restore-heading"
    >
      <h3 id="backup-restore-heading" class="font-subtitle text-2xl">Restore from a file</h3>
      <p>
        Choose a backup or an older character JSON file. You can review it before saving anything.
      </p>
      <label
        class={buttonVariants({
          variant: 'outline',
          class: `relative cursor-pointer focus-within:ring-2 focus-within:ring-primary ${busy ? 'opacity-50' : ''}`,
        })}
      >
        <Icon icon="upload" class="size-5" />
        Choose backup file
        <input
          class="absolute inset-0 h-full w-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
          type="file"
          accept=".json,application/json"
          disabled={busy}
          onchange={chooseFile}
          aria-label="Choose backup file"
        />
      </label>
      {#if filename}<p class="break-words text-gray-600 dark:text-gray-300">
          Selected: {filename}
        </p>{/if}
    </section>
    {#if busy}<p role="status">Working with your backup…</p>{/if}
    {#if error}<p class="my-2 text-red-700 dark:text-red-300" role="alert">{error}</p>{/if}
    {#if message}<p class="my-2" role="status">{message}</p>{/if}
    {#if warnings.length}
      <ul class="my-2 list-inside list-disc text-base text-amber-800 dark:text-amber-200">
        {#each warnings as warning (warning)}<li>{warning}</li>{/each}
      </ul>
    {/if}
    {#if prepared}
      <div class="mt-4 space-y-3 border-t border-purple-300 pt-3 dark:border-purple-700">
        <h3 class="font-subtitle text-2xl">Review before restoring</h3>
        {#if prepared.statuses.length}
          <ul class="list-inside list-disc text-base">
            {#each prepared.statuses as sheet (sheet.id)}
              <li>
                {sheet.name || 'Unnamed character'} — {sheet.state === 'new'
                  ? 'new character'
                  : sheet.state === 'same'
                    ? 'already present'
                    : 'a different copy or deletion exists'}
              </li>
            {/each}
          </ul>
          {#if prepared.statuses.some((sheet) => sheet.state === 'conflict')}
            <label class="flex flex-col gap-1 text-base"
              >If characters differ
              <select class="rounded border bg-transparent p-2" bind:value={policy} disabled={busy}>
                <option value="copy">Keep both: copy with new IDs</option>
                <option value="skip">Keep existing sheets and skip conflicts</option>
              </select>
            </label>
            <p class="text-base">
              New copies have “(copy)” added to their names. Existing sheets are kept.
            </p>
          {/if}
        {/if}
        {#if prepared.game.length}
          <p class="text-base">Game data: {prepared.game.map((x) => label(x.key)).join(', ')}.</p>
        {/if}
        {#if prepared.existingGame.length}
          <p class="text-base">
            Existing categories will be kept: {prepared.existingGame.map(label).join(', ')}.
          </p>
          <label class="flex items-start gap-2 text-base">
            <input type="checkbox" bind:checked={replaceGame} disabled={busy} />
            Replace those categories, keeping the previous records in local recovery storage. Close other
            Brighter Worlds tabs first.
          </label>
        {/if}
        <div class="flex flex-wrap gap-3">
          <Button disabled={busy} onclick={restore}>Restore this backup</Button>
          <Button
            variant="ghost"
            disabled={busy}
            onclick={() => {
              prepared = undefined;
              warnings = [];
            }}>Cancel</Button
          >
        </div>
      </div>
    {/if}
    {#if outcomes.length}
      <ul class="my-3 list-inside list-disc text-base">
        {#each outcomes as outcome, index (`${index}:${outcome.id}`)}
          <li>
            {label(outcome.name) || 'Unnamed character'} — {outcome.outcome === 'restored'
              ? 'restored'
              : outcome.outcome === 'already-processed'
                ? 'this transfer was already applied; nothing changed'
                : outcome.outcome === 'already-present'
                  ? 'already present; unchanged'
                  : 'current data kept'}
          </li>
        {/each}
      </ul>
      <p class="text-base">Reopen other sheet or GM pages to load restored data.</p>
      {#if lastPrepared?.bundle}
        <Button
          variant="outline"
          class="mt-2"
          disabled={busy}
          onclick={() =>
            perform(async () => {
              prepared = await prepareBackup(lastPrepared!.originalText);
              newTransferId = crypto.randomUUID();
              policy = 'copy';
              replaceGame = false;
              outcomes = [];
              warnings = [
                ...prepared.warnings,
                'This is a new restore. These sheets and their companions will be copied with new IDs and “(copy)” in their names.',
              ];
            })}>Make another copy</Button
        >
      {/if}
    {/if}
    <details class="border-t border-purple-200 pt-4 dark:border-purple-800">
      <summary class="cursor-pointer text-gray-600 dark:text-gray-300">Advanced recovery</summary>
      <div class="mt-3 space-y-3">
        <p>
          A private recovery archive can include original settings and Discord webhooks. Keep it
          private; it is for manual recovery and cannot be restored with the file picker above.
        </p>
        <Button variant="outline" disabled={busy} onclick={downloadPrivate}
          >Download private recovery archive</Button
        >
      </div>
    </details>
  </div>
  {#snippet footer()}
    <div class="flex justify-end border-t border-purple-200 pt-4 dark:border-purple-800">
      <Button variant="ghost" disabled={busy} onclick={() => dialog?.close()}>Close</Button>
    </div>
  {/snippet}
</DialogBase>
