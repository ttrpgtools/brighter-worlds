<script lang="ts">
  import InputDialog from '$lib/InputDialog.svelte';
  import type { DieValue, UsableEntity } from '$lib/types';
  import { id } from '$lib/rolling/id';
  import { cloneEditorDraft } from '$lib/util/gm-editor-validation';
  import { validDie } from './template-drafts';

  let dialog: InputDialog<UsableEntity> | undefined = $state();
  let draft: UsableEntity = $state({ id: '', name: '' });
  let damage = $state('');
  let editing = $state(false);
  let dirty = $state({ name: false, damage: false });
  let dice = $derived(
    damage.trim() ? damage.split(',').map((part) => Number(part.trim().replace(/^d/i, ''))) : [],
  );
  let damageValid = $derived(!damage.trim() || dice.every(validDie));

  export async function edit(attack?: UsableEntity) {
    dirty = { name: false, damage: false };
    editing = !!attack;
    draft = attack ? cloneEditorDraft(attack) : { id: id(), name: '', desc: '' };
    damage = (Array.isArray(draft.damage) ? draft.damage : draft.damage ? [draft.damage] : [])
      .map((die) => `d${die}`)
      .join(', ');
    const result = await dialog?.open();
    if (!result) return;
    const saved = cloneEditorDraft(result);
    saved.name = saved.name.trim();
    if (dice.length)
      saved.damage = dice.length === 1 ? (dice[0] as DieValue) : (dice as DieValue[]);
    else delete saved.damage;
    return saved;
  }
</script>

<InputDialog
  bind:this={dialog}
  form={draft}
  title={editing ? 'Edit Attack' : 'New Attack'}
  okBtnLabel={editing ? 'Save changes' : 'Create'}
  valid={!!draft.name.trim() && damageValid}
>
  <div class="flex flex-col gap-3">
    <label class="flex flex-col gap-1"
      >Name<input
        bind:value={draft.name}
        oninput={() => (dirty.name = true)}
        aria-invalid={dirty.name && !draft.name.trim()}
        class="rounded-full dark:bg-gray-900"
      /></label
    >
    {#if dirty.name && !draft.name.trim()}<p class="text-sm text-red-700 dark:text-red-300">
        Name: enter an attack name.
      </p>{/if}
    <label class="flex flex-col gap-1"
      >Description<textarea bind:value={draft.desc} class="rounded-xl dark:bg-gray-900"
      ></textarea></label
    >
    <label class="flex flex-col gap-1"
      >Damage dice (optional)<input
        bind:value={damage}
        oninput={() => (dirty.damage = true)}
        placeholder="d6 or d6, d8"
        class="rounded-full dark:bg-gray-900"
        aria-invalid={dirty.damage && !damageValid}
      /></label
    >
    {#if dirty.damage && !damageValid}<p class="text-sm text-red-700 dark:text-red-300">
        Damage: use d4, d6, d8, d10 or d12, separated by commas.
      </p>{/if}
    <label class="flex items-center gap-2"
      ><input type="checkbox" bind:checked={draft.blast} /> Blast</label
    >
  </div>
</InputDialog>
