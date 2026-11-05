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
      const json = await privateRecoveryFile(cache);
      warnings = JSON.parse(json).warnings;
      download(json, 'brighter-worlds-private-recovery.json');
      message =
        'Private recovery archive downloaded. Keep it private; it is not an ordinary portable backup.';
    });
  }
  export async function downloadCharacter(id: string) {
    await exportFile(false, [id]);
  }
  async function chooseFile(event: Event) {
    const input = event.currentTarget as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
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

<section
  class="w-full max-w-4xl rounded-lg border border-purple-300 p-4 dark:border-purple-700"
  aria-label="Character and game backups"
  aria-busy={busy}
>
  <h2 class="text-xl font-subtitle">Backups and restore</h2>
  <p class="mt-1 text-sm">
    Character backups include linked companions and embedded images. Game backups also include GM
    libraries, friends and display-only activity logs. Discord settings and sign-in details stay in
    this browser.
  </p>
  <div class="my-3 flex flex-wrap items-center gap-3">
    <button
      class="rounded border border-current px-3 py-2 disabled:opacity-50"
      disabled={busy}
      onclick={() => exportFile()}>Back up all characters</button
    >
    <button
      class="rounded border border-current px-3 py-2 disabled:opacity-50"
      disabled={busy}
      onclick={() => exportFile(true)}>Download game backup</button
    >
    <label class="flex flex-col gap-1 text-sm"
      >Choose a backup or legacy character file
      <input
        class="max-w-full"
        type="file"
        accept=".json,application/json"
        disabled={busy}
        onchange={chooseFile}
      />
    </label>
  </div>
  {#if busy}<p role="status">Working with your backup…</p>{/if}
  {#if error}<p class="my-2 text-red-700 dark:text-red-300" role="alert">{error}</p>{/if}
  {#if message}<p class="my-2" role="status">{message}</p>{/if}
  {#if warnings.length}
    <ul class="my-2 list-inside list-disc text-sm text-amber-800 dark:text-amber-200">
      {#each warnings as warning (warning)}<li>{warning}</li>{/each}
    </ul>
  {/if}
  {#if prepared}
    <div class="mt-4 space-y-3 border-t border-purple-300 pt-3 dark:border-purple-700">
      <h3 class="font-semibold">Review before restoring</h3>
      {#if prepared.statuses.length}
        <ul class="list-inside list-disc text-sm">
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
        <label class="flex flex-col gap-1 text-sm"
          >If characters differ
          <select class="rounded border bg-transparent p-2" bind:value={policy} disabled={busy}>
            <option value="copy">Keep both: copy the linked group with new IDs</option>
            <option value="skip">Keep current copies and skip conflicts</option>
          </select>
        </label>
      {/if}
      {#if prepared.game.length}
        <p class="text-sm">Game data: {prepared.game.map((x) => label(x.key)).join(', ')}.</p>
      {/if}
      {#if prepared.existingGame.length}
        <p class="text-sm">
          Existing categories will be kept: {prepared.existingGame.map(label).join(', ')}.
        </p>
        <label class="flex items-start gap-2 text-sm">
          <input type="checkbox" bind:checked={replaceGame} disabled={busy} />
          Replace those categories, keeping the previous records in local recovery storage. Close other
          Brighter Worlds tabs first.
        </label>
      {/if}
      <div class="flex flex-wrap gap-3">
        <button
          class="rounded bg-purple-800 px-4 py-2 text-white disabled:opacity-50"
          disabled={busy}
          onclick={restore}>Restore this backup</button
        >
        <button
          class="rounded border border-current px-3 py-2"
          disabled={busy}
          onclick={() => {
            prepared = undefined;
            warnings = [];
          }}>Cancel</button
        >
      </div>
    </div>
  {/if}
  {#if outcomes.length}
    <ul class="my-3 list-inside list-disc text-sm">
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
    <p class="text-sm">Reopen other sheet or GM pages to load restored data.</p>
    {#if lastPrepared?.bundle}
      <button
        class="mt-2 rounded border border-current px-3 py-2 text-sm"
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
              'This is a new restore. The linked character group will receive new IDs.',
            ];
          })}>Prepare another linked copy</button
      >
    {/if}
  {/if}
</section>
