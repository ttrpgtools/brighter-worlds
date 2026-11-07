<script lang="ts">
  import InputDialog from '$lib/InputDialog.svelte';
  import type { Encounter, NpcStats } from '$lib/types';
  import Button from '$lib/ui/button.svelte';
  import { cloneEditorDraft } from '$lib/util/gm-editor-validation';
  import NpcDialog from './NpcDialog.svelte';
  import NpcEditorDialog from '../NpcEditorDialog.svelte';
  import { newEncounterDraft, npcErrors, saveEncounterDraft } from '../template-drafts';

  let { npcList }: { npcList: NpcStats[] } = $props();
  let dialog: InputDialog<Encounter> | undefined = $state();
  let selectDialog: NpcDialog | undefined = $state();
  let npcEditor: NpcEditorDialog | undefined = $state();
  let draft = $state(newEncounterDraft());
  let editing = $state(false);
  let dirty = $state({ name: false, npcs: false });
  let errors = $derived([
    ...(!draft.name.trim() ? ['Name: enter an encounter name.'] : []),
    ...draft.npcs.flatMap((npc, i) => npcErrors(npc).map((error) => `NPC ${i + 1}: ${error}`)),
  ]);

  let visibleErrors = $derived([
    ...(dirty.name && !draft.name.trim() ? ['Name: enter an encounter name.'] : []),
    ...(dirty.npcs
      ? draft.npcs.flatMap((npc, i) => npcErrors(npc).map((error) => `NPC ${i + 1}: ${error}`))
      : []),
  ]);

  export async function edit(existing?: Encounter) {
    dirty = { name: false, npcs: false };
    editing = !!existing;
    draft = existing ? cloneEditorDraft(existing) : newEncounterDraft();
    const result = await dialog?.open();
    return result ? saveEncounterDraft(result) : undefined;
  }

  async function addNpc() {
    const selected = await selectDialog?.select();
    if (selected) {
      draft.npcs = [...draft.npcs, cloneEditorDraft(selected)];
      dirty.npcs = true;
    }
  }

  async function editNpc(npc: NpcStats, index: number) {
    const result = await npcEditor?.edit(npc);
    if (result) {
      draft.npcs = draft.npcs.map((current, i) => (i === index ? result : current));
      dirty.npcs = true;
    }
  }
</script>

<InputDialog
  bind:this={dialog}
  form={draft}
  title={editing ? 'Edit Encounter' : 'New Encounter'}
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
        aria-invalid={dirty.name && !draft.name.trim()}
      /></label
    >
    <label class="flex flex-col gap-1"
      >Description (optional)<textarea
        bind:value={draft.desc}
        rows="3"
        class="rounded-xl dark:bg-gray-900"
      ></textarea></label
    >
    <div class="flex flex-wrap justify-between items-center gap-2">
      <h4 class="font-bold">NPCs</h4>
      <Button size="sm" onclick={addNpc}>Add NPC</Button>
    </div>
    {#each draft.npcs as npc, index (npc)}
      <div
        class="flex flex-wrap gap-2 items-center border-b border-purple-200 dark:border-purple-800 pb-2"
      >
        <span class="min-w-0 flex-1 break-words"
          >{npc.name} <span class="text-sm opacity-70">{npc.grit} Grit</span></span
        >
        <Button
          size="sm"
          variant="ghost"
          aria-label={`Edit NPC ${index + 1}: ${npc.name} in encounter draft`}
          onclick={() => editNpc(npc, index)}>Edit</Button
        >
        <Button
          size="sm"
          variant="ghost"
          aria-label={`Remove NPC ${index + 1}: ${npc.name} from encounter draft`}
          onclick={() => (draft.npcs = draft.npcs.filter((_, i) => i !== index))}>Remove</Button
        >
      </div>
    {:else}<p class="text-sm text-gray-500 dark:text-gray-400">No NPCs added.</p>{/each}
    {#if visibleErrors.length}<ul class="text-sm text-red-700 dark:text-red-300" aria-live="polite">
        {#each visibleErrors as error (error)}<li>{error}</li>{/each}
      </ul>{/if}
  </div>
</InputDialog>

<NpcDialog bind:this={selectDialog} {npcList} />
<NpcEditorDialog bind:this={npcEditor} />
