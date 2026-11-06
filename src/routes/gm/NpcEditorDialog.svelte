<script lang="ts">
  import InputDialog from '$lib/InputDialog.svelte';
  import type { NpcStats, UsableEntity } from '$lib/types';
  import Button from '$lib/ui/button.svelte';
  import { cloneEditorDraft } from '$lib/util/gm-editor-validation';
  import { newNpcDraft, npcFieldErrors, saveNpcDraft } from './template-drafts';
  import AttackDialog from './AttackDialog.svelte';

  let dialog: InputDialog<NpcStats> | undefined = $state();
  let attackDialog: AttackDialog | undefined = $state();
  let draft = $state(newNpcDraft());
  let editing = $state(false);
  let dirty: Record<string, boolean> = $state({});
  let fieldErrors = $derived(npcFieldErrors(draft));
  let errors = $derived(Object.values(fieldErrors).flat());
  let visibleErrors = $derived(
    Object.entries(fieldErrors)
      .filter(([field]) => dirty[field])
      .flatMap(([, messages]) => messages),
  );

  export async function edit(existing?: NpcStats) {
    dirty = {};
    editing = !!existing;
    draft = existing ? cloneEditorDraft(existing) : newNpcDraft();
    const result = await dialog?.open();
    return result ? saveNpcDraft(result) : undefined;
  }

  async function editAttack(attack?: UsableEntity, index?: number) {
    const result = await attackDialog?.edit(attack);
    if (!result) return;
    dirty.attacks = true;
    if (index == null) draft.attacks = [...draft.attacks, result];
    else draft.attacks = draft.attacks.map((current, i) => (i === index ? result : current));
  }
</script>

<InputDialog
  bind:this={dialog}
  form={draft}
  title={editing ? 'Edit NPC' : 'New NPC'}
  okBtnLabel={editing ? 'Save changes' : 'Create'}
  valid={!errors.length}
  maxWidth="max-w-xl"
>
  <div class="flex flex-col gap-4">
    <label class="flex flex-col gap-1"
      >Name<input
        bind:value={draft.name}
        oninput={() => (dirty.name = true)}
        class="rounded-full dark:bg-gray-900"
        aria-invalid={!!dirty.name && !!fieldErrors.name.length}
      /></label
    >
    <div class="grid grid-cols-3 gap-3">
      {#each ['str', 'dex', 'wil'] as attr (attr)}
        {@const key = attr as 'str' | 'dex' | 'wil'}
        <label class="flex flex-col gap-1"
          >{attr.toUpperCase()}<select
            bind:value={draft[key]}
            onchange={() => (dirty[key] = true)}
            aria-invalid={!!dirty[key] && !!fieldErrors[key].length}
            class="rounded-full dark:bg-gray-900"
          >
            {#each [4, 6, 8, 10, 12] as die (die)}<option value={die}>d{die}</option>{/each}
          </select></label
        >
      {/each}
    </div>
    <div class="grid grid-cols-2 gap-3">
      <label class="flex flex-col gap-1"
        >Grit<input
          type="number"
          min="0"
          step="1"
          bind:value={draft.grit}
          oninput={() => (dirty.grit = true)}
          aria-invalid={!!dirty.grit && !!fieldErrors.grit.length}
          class="w-full rounded-full dark:bg-gray-900"
        /></label
      >
      <label class="flex flex-col gap-1"
        >Armor (optional)<input
          type="number"
          min="0"
          step="1"
          bind:value={draft.armor}
          oninput={() => (dirty.armor = true)}
          aria-invalid={!!dirty.armor && !!fieldErrors.armor.length}
          class="w-full rounded-full dark:bg-gray-900"
        /></label
      >
    </div>
    <div class="flex flex-wrap items-center justify-between gap-2">
      <h4 class="font-bold">Attacks</h4>
      <Button size="sm" onclick={() => editAttack()}>New attack</Button>
    </div>
    {#each draft.attacks as attack, index (attack.id)}
      <div class="flex flex-wrap items-center gap-2">
        <span class="min-w-0 flex-1 break-words">{attack.name}</span>
        <Button
          size="sm"
          variant="ghost"
          aria-label={`Edit attack ${attack.name}`}
          onclick={() => editAttack(attack, index)}>Edit</Button
        >
        <Button
          size="sm"
          variant="ghost"
          aria-label={`Remove attack ${attack.name} from draft`}
          onclick={() => (draft.attacks = draft.attacks.filter((_, i) => i !== index))}
          >Remove</Button
        >
      </div>
    {/each}
    {#if draft.image instanceof Blob}
      <div class="flex items-center gap-2">
        <span>Saved image</span><Button size="sm" variant="ghost" onclick={() => (draft.image = '')}
          >Remove image</Button
        >
      </div>
    {:else}
      <label class="flex flex-col gap-1"
        >Image (optional)<input
          bind:value={draft.image}
          oninput={() => (dirty.image = true)}
          aria-invalid={!!dirty.image && !!fieldErrors.image.length}
          class="rounded-full dark:bg-gray-900"
        /></label
      >
    {/if}
    <label class="flex flex-col gap-1"
      >Description (optional)<textarea bind:value={draft.desc} class="rounded-xl dark:bg-gray-900"
      ></textarea></label
    >
    <label class="flex flex-col gap-1"
      >Notes (one per line)<textarea
        bind:value={() => draft.notes.join('\n'), (value) => (draft.notes = value.split('\n'))}
        rows="3"
        class="rounded-xl dark:bg-gray-900"
      ></textarea></label
    >
    <label class="flex flex-col gap-1"
      >Wants (optional)<input
        bind:value={draft.wants}
        class="rounded-full dark:bg-gray-900"
      /></label
    >
    <label class="flex flex-col gap-1"
      >Found (optional)<input
        bind:value={draft.found}
        class="rounded-full dark:bg-gray-900"
      /></label
    >
    {#if visibleErrors.length}<ul class="text-sm text-red-700 dark:text-red-300" aria-live="polite">
        {#each visibleErrors as error (error)}<li>{error}</li>{/each}
      </ul>{/if}
  </div>
</InputDialog>

<AttackDialog bind:this={attackDialog} />
