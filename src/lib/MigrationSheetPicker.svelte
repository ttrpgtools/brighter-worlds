<script lang="ts">
  import Button from '$lib/ui/button.svelte';

  let {
    sheets,
    selected = $bindable(),
    disabled = false,
    canCopy = false,
    oncopy,
    ondownload,
  }: {
    sheets: { id: string; name: string; calling: string; companions: number }[];
    selected: string[];
    disabled?: boolean;
    canCopy?: boolean;
    oncopy: () => void;
    ondownload: () => void;
  } = $props();
</script>

<fieldset {disabled} class="space-y-3">
  <legend class="mb-3 font-subtitle text-2xl">Choose sheets to copy</legend>
  {#if sheets.length}
    <div class="flex flex-wrap items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        disabled={disabled || selected.length === sheets.length}
        onclick={() => (selected = sheets.map((sheet) => sheet.id))}>Select all</Button
      >
      <Button
        variant="ghost"
        size="sm"
        disabled={disabled || !selected.length}
        onclick={() => (selected = [])}>Deselect all</Button
      >
      <span class="text-base text-gray-600 dark:text-gray-300" role="status"
        >{selected.length} of {sheets.length} selected</span
      >
    </div>
  {/if}
  <div class="max-h-96 space-y-2 overflow-y-auto">
    {#each sheets as sheet (sheet.id)}
      <label
        class="flex cursor-pointer items-start gap-3 rounded-xl border border-purple-200 p-3 dark:border-purple-800"
      >
        <input type="checkbox" bind:group={selected} value={sheet.id} class="mt-1" />
        <span class="min-w-0 break-words">
          <strong>{sheet.name || 'Unnamed character'}</strong>
          <span class="block text-base text-gray-600 dark:text-gray-300">
            {sheet.calling || 'No Calling'}{sheet.companions
              ? ` · ${sheet.companions === 1 ? '1 companion sheet' : `${sheet.companions} companion sheets`}`
              : ''}
          </span>
        </span>
      </label>
    {:else}<p>No readable local sheets were found in this browser.</p>{/each}
  </div>
  <p class="text-base text-gray-600 dark:text-gray-300">
    Companion sheets are included automatically. Notes, equipment and images are included; private
    settings such as Discord webhooks stay here.
  </p>
  <div class="flex flex-wrap gap-3">
    {#if canCopy}
      <Button
        class="max-w-full whitespace-normal"
        disabled={disabled || !selected.length}
        onclick={oncopy}>Copy selected sheets to brighterworlds.app</Button
      >
    {/if}
    <Button
      class="max-w-full whitespace-normal"
      variant="outline"
      disabled={disabled || !selected.length}
      onclick={ondownload}>Download selected sheets as a backup</Button
    >
  </div>
</fieldset>
