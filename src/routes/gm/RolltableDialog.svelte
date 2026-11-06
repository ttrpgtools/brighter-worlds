<script lang="ts">
  import InputDialog from '$lib/InputDialog.svelte';
  import { id } from '$lib/rolling/id';
  import type { NpcStats, CustomRolltableDef, Encounter, Item } from '$lib/types';
  import Button from '$lib/ui/button.svelte';
  import {
    tableDraft,
    tableErrors,
    saveTableDraft,
    type TableDraft,
  } from '$lib/util/rolltable-editor';

  interface Props {
    npcList?: NpcStats[];
    encList?: Encounter[];
    relicList?: Item[];
  }
  let { npcList = [], encList = [], relicList = [] }: Props = $props();
  let entities = $derived([...encList, ...relicList, ...npcList]);
  let dialog: InputDialog<TableDraft> | undefined = $state();
  let form: TableDraft = $state(newForm());
  let editing = $state(false);
  let dirty: Record<string, boolean> = $state({});
  let errors = $derived(tableErrors(form, entities));
  let valid = $derived(
    !errors.name &&
      !errors.formula &&
      !errors.options &&
      !errors.rows.some((row) => row.trigger || row.value),
  );

  function newForm(): TableDraft {
    return { id: id(), name: '', formula: '', options: [] };
  }
  async function showForm() {
    const item = await dialog?.open();
    if (item) return saveTableDraft(item, entities);
  }
  export async function getNew() {
    dirty = {};
    editing = false;
    form = newForm();
    return showForm();
  }
  export async function edit(existing: CustomRolltableDef) {
    dirty = {};
    editing = true;
    form = tableDraft(existing);
    return showForm();
  }
  function addOption() {
    dirty.options = true;
    form.options.push({
      key: id(),
      type: 'text',
      text: '',
      entityId: '',
      trigger: String(form.options.length + 1),
    });
  }
</script>

<InputDialog
  title={editing ? 'Edit Roll Table' : 'New Roll Table'}
  okBtnLabel={editing ? 'Save changes' : 'Create'}
  {valid}
  bind:this={dialog}
  {form}
>
  <div class="flex flex-col gap-3 text-left">
    <label class="flex flex-col gap-1"
      >Name
      <input
        type="text"
        data-1p-ignore
        bind:value={form.name}
        oninput={() => (dirty.name = true)}
        aria-invalid={!!dirty.name && !!errors.name}
        class="rounded-full dark:bg-gray-900 dark:text-white focus:ring-purple-500 focus:border-purple-500"
      />
      {#if dirty.name && errors.name}<span class="text-sm text-red-700 dark:text-red-300"
          >{errors.name}</span
        >{/if}
    </label>
    <label class="flex flex-col gap-1"
      >Dice formula
      <input
        type="text"
        placeholder="2d6+1"
        bind:value={form.formula}
        oninput={() => (dirty.formula = true)}
        aria-invalid={!!dirty.formula && !!errors.formula}
        class="rounded-full dark:bg-gray-900 dark:text-white focus:ring-purple-500 focus:border-purple-500"
      />
      {#if dirty.formula && errors.formula}<span class="text-sm text-red-700 dark:text-red-300"
          >{errors.formula}</span
        >{/if}
    </label>
    <div class="flex items-center justify-between gap-2">
      <h3 class="font-bold">Options</h3>
      <Button size="sm" onclick={addOption}>Add option</Button>
    </div>
    <p class="text-sm text-gray-600 dark:text-gray-300">
      Overlapping triggers return all matching options. Gaps return no result.
    </p>
    {#if dirty.options && errors.options}<p class="text-sm text-red-700 dark:text-red-300">
        {errors.options}
      </p>{/if}
    {#each form.options as opt, oi (opt.key)}
      <fieldset
        class="min-w-0 rounded-xl border border-gray-300 p-3 dark:border-gray-700 flex flex-col gap-2"
      >
        <legend class="px-1">Option {oi + 1}</legend>
        <label class="flex flex-col gap-1"
          >Result type
          <select
            bind:value={opt.type}
            onchange={() => (dirty[`${opt.key}:type`] = true)}
            class="rounded-full dark:bg-gray-900 dark:text-white focus:ring-purple-500 focus:border-purple-500"
            ><option value="text">Text</option><option value="entity">Entity</option></select
          >
        </label>
        {#if opt.type === 'text'}
          <label class="flex flex-col gap-1"
            >Result text
            <input
              type="text"
              bind:value={opt.text}
              oninput={() => (dirty[`${opt.key}:text`] = true)}
              aria-invalid={!!dirty[`${opt.key}:${opt.type}`] && !!errors.rows[oi].value}
              class="min-w-0 rounded-full dark:bg-gray-900 dark:text-white focus:ring-purple-500 focus:border-purple-500"
            />
          </label>
        {:else}
          <label class="flex flex-col gap-1"
            >Entity
            <select
              bind:value={opt.entityId}
              onchange={() => (dirty[`${opt.key}:entity`] = true)}
              aria-invalid={!!dirty[`${opt.key}:${opt.type}`] && !!errors.rows[oi].value}
              class="min-w-0 w-full rounded-full dark:bg-gray-900 dark:text-white focus:ring-purple-500 focus:border-purple-500"
            >
              <option value="">Choose an entity</option>
              {#if opt.entityId && !entities.some((entity) => entity.id === opt.entityId)}<option
                  value={opt.entityId}>Missing reference ({opt.entityId})</option
                >{/if}
              <optgroup label="Encounters"
                >{#each encList as item (item.id)}<option value={item.id}>{item.name}</option
                  >{/each}</optgroup
              >
              <optgroup label="Items"
                >{#each relicList as item (item.id)}<option value={item.id}>{item.name}</option
                  >{/each}</optgroup
              >
              <optgroup label="NPCs"
                >{#each npcList as item (item.id)}<option value={item.id}>{item.name}</option
                  >{/each}</optgroup
              >
            </select>
          </label>
        {/if}
        {#if dirty[`${opt.key}:${opt.type}`] && errors.rows[oi].value}<p
            class="text-sm text-red-700 dark:text-red-300"
          >
            {errors.rows[oi].value}
          </p>{/if}
        {#if opt.type === 'entity' && opt.entityId && !entities.some((entity) => entity.id === opt.entityId) && !dirty[`${opt.key}:entity`]}
          <p class="text-sm text-gray-600 dark:text-gray-300">
            This saved reference is unavailable. Choose another entity or remove this option before
            saving.
          </p>
        {/if}
        <label class="flex flex-col gap-1"
          >Trigger or range
          <input
            type="text"
            placeholder="1-3"
            bind:value={opt.trigger}
            oninput={() => (dirty[`${opt.key}:trigger`] = true)}
            aria-invalid={!!dirty[`${opt.key}:trigger`] && !!errors.rows[oi].trigger}
            class="rounded-full dark:bg-gray-900 dark:text-white focus:ring-purple-500 focus:border-purple-500"
          />
          {#if dirty[`${opt.key}:trigger`] && errors.rows[oi].trigger}<span
              class="text-sm text-red-700 dark:text-red-300">{errors.rows[oi].trigger}</span
            >{/if}
        </label>
        <Button
          size="sm"
          variant="ghost"
          aria-label={`Remove option ${oi + 1}`}
          onclick={() => {
            dirty.options = true;
            form.options = form.options.filter((row) => row.key !== opt.key);
          }}>Remove option</Button
        >
      </fieldset>
    {/each}
  </div>
</InputDialog>
