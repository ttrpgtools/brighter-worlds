<script lang="ts">
  import { recoveryState, ensureSheetMigration, localRecoveryFile } from '$lib/data/sheet-recovery';
  import { download } from '$lib/util/download';
  import type { SheetCache } from '$lib/data/sheet-manager';
  import { getAccountSession } from '$lib/data/account-session';
  const session = getAccountSession();
  let { cache }: { cache?: SheetCache } = $props();
  let error = $state('');
  let working = $state(false);
  async function exportOriginals() {
    if (
      !confirm(
        'This private recovery file contains original records, including any Discord webhook settings. Keep it private. Download it?',
      )
    )
      return;
    working = true;
    try {
      const owner = session.current().account?.user?.id ?? session.current().offlineOwner;
      const json = await localRecoveryFile(cache, owner);
      if ((session.current().account?.user?.id ?? session.current().offlineOwner) !== owner)
        throw new Error('The account changed. Prepare the archive again.');
      download(json, 'brighter-worlds-private-recovery.json');
    } catch {
      error =
        'The browser could not read the original records. Keep this page open and check browser storage permissions.';
    } finally {
      working = false;
    }
  }
</script>

{#if $recoveryState.issues.length || $recoveryState.writeError || error}
  <section
    class="relative z-10 w-full max-w-4xl rounded-lg border border-amber-500 bg-amber-50 p-4 text-amber-950 dark:bg-amber-950 dark:text-amber-100"
    aria-label="Saved character recovery"
  >
    <h2 class="font-semibold">Some saved data needs attention</h2>
    {#if $recoveryState.writeError}<p>{$recoveryState.writeError}</p>{/if}
    <ul class="my-2 list-inside list-disc">
      {#each $recoveryState.issues as issue (issue.key)}
        <li><span class="font-mono text-sm">{issue.key}</span>: {issue.message}</li>
      {/each}
    </ul>
    <p>
      Original records are kept. You can download a private archive for manual recovery without
      saving or signing in.
    </p>
    <div class="mt-3 flex flex-wrap gap-3">
      <button
        class="rounded border border-current px-3 py-2"
        onclick={() => ensureSheetMigration()}
        disabled={$recoveryState.busy}>Retry storage check</button
      >
      <button
        class="rounded border border-current px-3 py-2"
        onclick={exportOriginals}
        disabled={working}>Download original records (private)</button
      >
    </div>
    {#if error}<p role="alert">{error}</p>{/if}
  </section>
{/if}
