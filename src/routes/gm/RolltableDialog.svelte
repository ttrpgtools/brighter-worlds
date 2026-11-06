<script lang="ts">
  import InputDialog from '$lib/InputDialog.svelte';
  import { id } from '$lib/rolling/id';
  import type { NpcStats, CustomRolltableDef, Encounter, Item } from '$lib/types';
  import Button from '$lib/ui/button.svelte';
  import { tick } from 'svelte';
  import {
    tableDraft,
    tableErrors,
    saveTableDraft,
    parseTableDice,
    tableDiceFormula,
    tableRollRange,
    missingTableRolls,
    generateTableEntries,
    MAX_GENERATED_TABLE_ENTRIES,
    type TableDraft,
    type TableDice,
  } from '$lib/util/rolltable-editor';

  interface Props {
    npcList?: NpcStats[];
    encList?: Encounter[];
    relicList?: Item[];
  }
  let { npcList = [], encList = [], relicList = [] }: Props = $props();
  const commonDice = [2, 3, 4, 6, 8, 10, 12, 20, 100];
  let entities = $derived([...encList, ...relicList, ...npcList]);
  let dialog: InputDialog<TableDraft> | undefined = $state();
  let form: TableDraft = $state(newForm());
  let editing = $state(false);
  let mode: 'dice' | 'formula' = $state('dice');
  let dice: TableDice = $state({ count: 1, sides: 6, modifier: 0 });
  let dirty: Record<string, boolean> = $state({});
  let errors = $derived(tableErrors(form, entities));
  let valid = $derived(
    !errors.name &&
      !errors.formula &&
      !errors.options &&
      !errors.rows.some((row) => row.trigger || row.value),
  );
  let diceErrors = $derived({
    count:
      Number.isSafeInteger(dice.count) && dice.count >= 1 && dice.count <= 10000
        ? ''
        : 'Use 1 to 10,000 whole dice.',
    modifier:
      dice.modifier == null || Number.isSafeInteger(dice.modifier)
        ? ''
        : 'Use a whole-number modifier.',
  });
  let range = $derived(tableRollRange(form.formula));
  let missing = $derived(missingTableRolls(form.formula, form.options));

  function newForm(): TableDraft {
    return { id: id(), name: '', formula: 'd6', options: [] };
  }
  async function showForm() {
    const item = await dialog?.open();
    if (item) return saveTableDraft(item, entities);
  }
  export async function getNew() {
    dirty = {};
    editing = false;
    mode = 'dice';
    dice = { count: 1, sides: 6, modifier: 0 };
    form = newForm();
    return showForm();
  }
  export async function edit(existing: CustomRolltableDef) {
    dirty = {};
    editing = true;
    form = tableDraft(existing);
    const parsed = parseTableDice(form.formula);
    mode = parsed ? 'dice' : 'formula';
    dice = parsed ?? { count: 1, sides: 6, modifier: 0 };
    return showForm();
  }
  function updateDice() {
    form.formula = tableDiceFormula({ ...dice, modifier: dice.modifier ?? 0 });
    dirty.formula = true;
  }
  function changeMode(next: 'dice' | 'formula') {
    if (mode === next) return;
    if (next === 'dice') {
      const parsed = parseTableDice(form.formula);
      dice = parsed ?? { count: 1, sides: 6, modifier: 0 };
      if (!parsed) updateDice();
    }
    mode = next;
  }
  async function focusResult(key: string) {
    await tick();
    document.getElementById(`rolltable-result-${key}`)?.focus();
  }
  function addOption() {
    dirty.options = true;
    const key = id();
    form.options.push({
      key,
      type: 'text',
      text: '',
      entityId: '',
      trigger: missing?.length ? String(missing[0]) : range ? '' : String(form.options.length + 1),
    });
    void focusResult(key);
  }
  function fillMissing() {
    const entries = generateTableEntries(form.formula, form.options, id);
    if (!entries.length) return;
    dirty.options = true;
    form.options.push(...entries);
    void focusResult(entries[0].key);
  }
  async function removeOption(key: string) {
    const index = form.options.findIndex((row) => row.key === key);
    dirty.options = true;
    form.options = form.options.filter((row) => row.key !== key);
    const next = form.options[index] ?? form.options[index - 1];
    if (next) await focusResult(next.key);
    else {
      await tick();
      document.getElementById('rolltable-add-entry')?.focus();
    }
  }
</script>

<InputDialog
  title={editing ? 'Edit Roll Table' : 'New Roll Table'}
  okBtnLabel={editing ? 'Save changes' : 'Create'}
  maxWidth="max-w-4xl"
  {valid}
  bind:this={dialog}
  {form}
>
  <div class="flex flex-col gap-5 text-left">
    <div class="flex flex-col gap-1">
      <label for="rolltable-name">Name</label>
      <input
        id="rolltable-name"
        type="text"
        data-1p-ignore
        bind:value={form.name}
        oninput={() => (dirty.name = true)}
        aria-invalid={!!dirty.name && !!errors.name}
        aria-describedby={dirty.name && errors.name ? 'rolltable-name-error' : undefined}
        class="rounded-full dark:bg-gray-900 focus:ring-purple-500 focus:border-purple-500"
      />
      {#if dirty.name && errors.name}<p
          id="rolltable-name-error"
          class="text-sm text-red-700 dark:text-red-300"
        >
          {errors.name}
        </p>{/if}
    </div>

    <fieldset class="rounded-xl border border-purple-200 p-4 dark:border-purple-800">
      <legend class="px-1 font-semibold">Roll method</legend>
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div
          class="inline-flex rounded-full bg-purple-100 p-1 dark:bg-gray-800"
          role="group"
          aria-label="Roll input method"
        >
          <Button
            size="sm"
            variant={mode === 'dice' ? 'default' : 'ghost'}
            aria-pressed={mode === 'dice'}
            onclick={() => changeMode('dice')}>Dice</Button
          >
          <Button
            size="sm"
            variant={mode === 'formula' ? 'default' : 'ghost'}
            aria-pressed={mode === 'formula'}
            onclick={() => changeMode('formula')}>Custom formula</Button
          >
        </div>
        {#if range}<p class="text-sm text-gray-600 dark:text-gray-300">
            <strong class="text-gray-900 dark:text-white">{form.formula}</strong> · Rolls {range.minimum}–{range.maximum}
          </p>{/if}
      </div>
      {#if mode === 'dice'}
        <div class="mt-4 grid grid-cols-3 items-start gap-4">
          <div class="flex min-w-0 flex-col gap-1">
            <label for="rolltable-dice-count">Dice count</label>
            <input
              id="rolltable-dice-count"
              type="number"
              min="1"
              max="10000"
              step="1"
              bind:value={
                () => dice.count,
                (value) => {
                  dice.count = value;
                  dirty.count = true;
                  updateDice();
                }
              }
              aria-invalid={!!dirty.count && !!diceErrors.count}
              aria-describedby={dirty.count && diceErrors.count
                ? 'rolltable-count-error'
                : undefined}
              class="w-full rounded-full dark:bg-gray-900 focus:ring-purple-500 focus:border-purple-500"
            />
            {#if dirty.count && diceErrors.count}<p
                id="rolltable-count-error"
                class="text-sm text-red-700 dark:text-red-300"
              >
                {diceErrors.count}
              </p>{/if}
          </div>
          <div class="flex min-w-0 flex-col gap-1">
            <label for="rolltable-die">Die</label>
            <select
              id="rolltable-die"
              bind:value={
                () => dice.sides,
                (value) => {
                  dice.sides = value;
                  updateDice();
                }
              }
              class="w-full rounded-full dark:bg-gray-900 focus:ring-purple-500 focus:border-purple-500"
            >
              {#if !commonDice.includes(dice.sides)}<option value={dice.sides}>d{dice.sides}</option
                >{/if}
              {#each commonDice as sides (sides)}<option value={sides}>d{sides}</option>{/each}
            </select>
          </div>
          <div class="flex min-w-0 flex-col gap-1">
            <label for="rolltable-modifier">Modifier (optional)</label>
            <input
              id="rolltable-modifier"
              type="number"
              step="1"
              bind:value={
                () => dice.modifier,
                (value) => {
                  dice.modifier = value;
                  dirty.modifier = true;
                  updateDice();
                }
              }
              aria-invalid={!!dirty.modifier && !!diceErrors.modifier}
              aria-describedby={dirty.modifier && diceErrors.modifier
                ? 'rolltable-modifier-error'
                : undefined}
              class="w-full rounded-full dark:bg-gray-900 focus:ring-purple-500 focus:border-purple-500"
            />
            {#if dirty.modifier && diceErrors.modifier}<p
                id="rolltable-modifier-error"
                class="text-sm text-red-700 dark:text-red-300"
              >
                {diceErrors.modifier}
              </p>{/if}
          </div>
        </div>
        {#if dirty.formula && !diceErrors.count && !diceErrors.modifier && errors.formula}<p
            class="mt-2 text-sm text-red-700 dark:text-red-300"
          >
            The dice and modifier must produce safe whole-number totals.
          </p>{/if}
      {:else}
        <div class="mt-4 flex flex-col gap-1">
          <label for="rolltable-formula">Dice formula</label>
          <input
            id="rolltable-formula"
            type="text"
            placeholder="2d6+1"
            bind:value={form.formula}
            oninput={() => (dirty.formula = true)}
            aria-invalid={!!dirty.formula && !!errors.formula}
            aria-describedby={dirty.formula && errors.formula
              ? 'rolltable-formula-error'
              : undefined}
            class="rounded-full dark:bg-gray-900 focus:ring-purple-500 focus:border-purple-500"
          />
          {#if dirty.formula && errors.formula}<p
              id="rolltable-formula-error"
              class="text-sm text-red-700 dark:text-red-300"
            >
              {errors.formula}
            </p>{/if}
        </div>
      {/if}
    </fieldset>

    <div class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h3 class="font-semibold">
          Entries <span class="font-normal text-gray-500 dark:text-gray-400"
            >({form.options.length})</span
          >
        </h3>
        {#if missing}
          <p class="mt-1 text-sm text-gray-600 dark:text-gray-300" aria-live="polite">
            {missing.length
              ? `${missing.length} of ${range?.count} rolls have no entry.`
              : 'Every roll has an entry.'} Existing entries are kept when filling rolls.
          </p>
        {:else if range && range.count > MAX_GENERATED_TABLE_ENTRIES}
          <p class="mt-1 text-sm text-gray-600 dark:text-gray-300">
            Use ranges for these {range.count} possible rolls. Automatic entries support up to {MAX_GENERATED_TABLE_ENTRIES}
            rolls.
          </p>
        {:else}<p class="mt-1 text-sm text-gray-600 dark:text-gray-300">
            Use a formula such as 2d6+1 to generate entries, or add entries yourself.
          </p>{/if}
      </div>
      <Button size="sm" variant="outline" disabled={!missing?.length} onclick={fillMissing}>
        {form.options.length === 0 && missing?.length
          ? `Create ${missing.length} entries`
          : missing?.length
            ? `Fill ${missing.length} missing rolls`
            : 'Fill missing rolls'}
      </Button>
    </div>
    {#if dirty.options && errors.options}<p class="text-sm text-red-700 dark:text-red-300">
        {errors.options}
      </p>{/if}

    <div
      class="flex flex-col divide-y divide-purple-200 rounded-xl border border-purple-200 dark:divide-purple-800 dark:border-purple-800"
    >
      {#each form.options as opt, oi (opt.key)}
        <fieldset
          class="grid min-w-0 gap-3 p-3 md:grid-cols-[6.5rem_10rem_minmax(0,1fr)_2.75rem] md:items-start"
        >
          <legend class="sr-only">Entry {oi + 1}</legend>
          <div class="flex min-w-0 flex-col gap-1">
            <label for={`rolltable-trigger-${opt.key}`} class="text-sm">Roll</label>
            <input
              id={`rolltable-trigger-${opt.key}`}
              type="text"
              placeholder="1-3"
              bind:value={opt.trigger}
              aria-label={`Roll for entry ${oi + 1}`}
              oninput={() => (dirty[`${opt.key}:trigger`] = true)}
              aria-invalid={!!dirty[`${opt.key}:trigger`] && !!errors.rows[oi].trigger}
              aria-describedby={dirty[`${opt.key}:trigger`] && errors.rows[oi].trigger
                ? `rolltable-trigger-error-${opt.key}`
                : undefined}
              class="min-w-0 w-full rounded-full dark:bg-gray-900 focus:ring-purple-500 focus:border-purple-500"
            />
            {#if dirty[`${opt.key}:trigger`] && errors.rows[oi].trigger}<p
                id={`rolltable-trigger-error-${opt.key}`}
                class="text-sm text-red-700 dark:text-red-300"
              >
                {errors.rows[oi].trigger}
              </p>{/if}
          </div>
          <div class="flex flex-col gap-1">
            <span class="text-sm">Result type</span>
            <div
              role="group"
              aria-label={`Result type for entry ${oi + 1}`}
              class="inline-flex self-start rounded-full bg-purple-100 p-1 dark:bg-gray-800"
            >
              <Button
                size="sm"
                class="text-sm"
                variant={opt.type === 'text' ? 'default' : 'ghost'}
                aria-pressed={opt.type === 'text'}
                onclick={() => (opt.type = 'text')}>Text</Button
              >
              <Button
                size="sm"
                class="text-sm"
                variant={opt.type === 'entity' ? 'default' : 'ghost'}
                aria-pressed={opt.type === 'entity'}
                onclick={() => (opt.type = 'entity')}>Entity</Button
              >
            </div>
          </div>
          <div class="flex min-w-0 flex-col gap-1">
            {#if opt.type === 'text'}
              <label for={`rolltable-result-${opt.key}`} class="text-sm">Text</label>
              <textarea
                id={`rolltable-result-${opt.key}`}
                rows="2"
                placeholder="What happens?"
                bind:value={opt.text}
                aria-label={`Text for entry ${oi + 1}`}
                oninput={() => (dirty[`${opt.key}:text`] = true)}
                aria-invalid={!!dirty[`${opt.key}:text`] && !!errors.rows[oi].value}
                aria-describedby={dirty[`${opt.key}:text`] && errors.rows[oi].value
                  ? `rolltable-value-error-${opt.key}`
                  : undefined}
                class="min-w-0 w-full rounded-xl dark:bg-gray-900 focus:ring-purple-500 focus:border-purple-500"
              ></textarea>
            {:else}
              <label for={`rolltable-result-${opt.key}`} class="text-sm">Entity</label>
              <select
                id={`rolltable-result-${opt.key}`}
                bind:value={opt.entityId}
                aria-label={`Entity for entry ${oi + 1}`}
                onchange={() => (dirty[`${opt.key}:entity`] = true)}
                aria-invalid={!!dirty[`${opt.key}:entity`] && !!errors.rows[oi].value}
                aria-describedby={dirty[`${opt.key}:entity`] && errors.rows[oi].value
                  ? `rolltable-value-error-${opt.key}`
                  : undefined}
                class="min-w-0 w-full rounded-full dark:bg-gray-900 focus:ring-purple-500 focus:border-purple-500"
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
            {/if}
            {#if dirty[`${opt.key}:${opt.type}`] && errors.rows[oi].value}<p
                id={`rolltable-value-error-${opt.key}`}
                class="text-sm text-red-700 dark:text-red-300"
              >
                {errors.rows[oi].value}
              </p>{/if}
            {#if opt.type === 'entity' && opt.entityId && !entities.some((entity) => entity.id === opt.entityId) && !dirty[`${opt.key}:entity`]}
              <p class="text-sm text-gray-600 dark:text-gray-300">
                This saved reference is unavailable. Choose another entity or remove this entry
                before saving.
              </p>
            {/if}
          </div>
          <Button
            size="icon"
            variant="ghost"
            icon="xmark"
            class="md:mt-5"
            aria-label={`Remove entry ${oi + 1}`}
            onclick={() => removeOption(opt.key)}
          />
        </fieldset>
      {:else}<p class="p-5 text-center text-sm text-gray-500 dark:text-gray-400">
          Create entries for the dice above, or add your first entry.
        </p>{/each}
    </div>
    <div class="flex flex-wrap items-center justify-between gap-3">
      <Button id="rolltable-add-entry" size="sm" variant="outline" icon="plus" onclick={addOption}
        >Add entry</Button
      >
      <p class="text-sm text-gray-500 dark:text-gray-400">
        Ranges are allowed. Overlaps return every match; gaps return no result.
      </p>
    </div>
  </div>
</InputDialog>
