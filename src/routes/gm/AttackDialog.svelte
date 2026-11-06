<script lang="ts">
  import InputDialog from '$lib/InputDialog.svelte';
  import type { DieValue, UsableEntity } from '$lib/types';
  import { id } from '$lib/rolling/id';
  import { cloneEditorDraft } from '$lib/util/gm-editor-validation';
  import { validDie } from './template-drafts';
  import DieSelector from '$lib/sheet/DieSelector.svelte';
  import Button from '$lib/ui/button.svelte';

  interface DamageDie {
    key: string;
    value: DieValue | 0;
  }

  let dialog: InputDialog<UsableEntity> | undefined = $state();
  let draft: UsableEntity = $state({ id: '', name: '' });
  let damage: DamageDie[] = $state([]);
  let editing = $state(false);
  let dirty = $state({ name: false, damage: false });
  let dice = $derived(damage.map((die) => die.value).filter((value) => value !== 0));
  let damageValid = $derived(damage.every((die) => die.value === 0 || validDie(die.value)));

  export async function edit(attack?: UsableEntity) {
    dirty = { name: false, damage: false };
    editing = !!attack;
    draft = attack ? cloneEditorDraft(attack) : { id: id(), name: '', desc: '' };
    damage = (
      Array.isArray(draft.damage) ? draft.damage : draft.damage ? [draft.damage] : [0 as const]
    ).map((value) => ({ key: id(), value }));
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
    <fieldset class="flex flex-col gap-2">
      <legend class="mb-2">Damage dice (optional)</legend>
      <div class="flex flex-wrap items-center gap-3">
        {#each damage as die, index (die.key)}
          <div class="flex items-center gap-1">
            <div class="w-24">
              <DieSelector
                label={`Damage die ${index + 1}`}
                nullable
                bind:current={
                  () => die.value,
                  (value) => {
                    die.value = value;
                    dirty.damage = true;
                  }
                }
                invalid={dirty.damage && die.value !== 0 && !validDie(die.value)}
              />
            </div>
            {#if damage.length > 1}
              <Button
                size="icon-sm"
                variant="ghost"
                icon="xmark"
                aria-label={`Remove damage die ${index + 1}`}
                onclick={() => {
                  damage = damage.filter((current) => current.key !== die.key);
                  dirty.damage = true;
                }}
              />
            {/if}
          </div>
        {/each}
        <Button
          size="sm"
          class="text-sm"
          variant="ghost"
          icon="plus"
          onclick={() => {
            damage = [...damage, { key: id(), value: 0 }];
            dirty.damage = true;
          }}>Add die</Button
        >
      </div>
    </fieldset>
    {#if dirty.damage && !damageValid}<p class="text-sm text-red-700 dark:text-red-300">
        Damage: choose d4, d6, d8, d10 or d12, or no die.
      </p>{/if}
    <label class="flex items-center gap-2"
      ><input type="checkbox" bind:checked={draft.blast} /> Blast</label
    >
  </div>
</InputDialog>
