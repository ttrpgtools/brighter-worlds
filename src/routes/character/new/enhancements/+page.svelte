<script lang="ts">
  import { STEP, getWizard, guardWizardStep } from '../wizard.svelte';
  import Button from '$lib/ui/button.svelte';
  import GroupInputs from '$lib/GroupInputs.svelte';
  import { untrack } from 'svelte';
  import {
    creationGroups,
    improveItem,
    validateCreationSelections,
    type CreationSelection,
  } from '$lib/data/character-creation';
  import { enhancementManager } from '$lib/data/table-manager';

  const [wizard, builder] = getWizard();
  guardWizardStep(wizard, STEP.ENHANCEMENTS);
  const groups = creationGroups(untrack(() => builder.sheet.choices ?? []));
  const selected: Record<string, CreationSelection[]> = $state(
    Object.fromEntries(
      groups.map(({ table, count }) => [
        table.id,
        table.type === 'improvement'
          ? Array.from({ length: count }, (_, index) => ({
              table: table.id,
              type: table.type,
              name: '',
              desc: '',
              target:
                builder.sheet.calling?.id === 'calling-artificer' && index === 0
                  ? builder.sheet.equipment?.[2]?.id
                  : '',
              note: '',
            }))
          : [],
      ]),
    ),
  );
  let formName = $state('');
  let faithImprovement = $state('');
  let choices = $derived(
    groups
      .flatMap(({ table }) => selected[table.id] ?? [])
      .map((s) =>
        s.name === 'Weapon of Faith' && s.table === 'rt-devoted-boons'
          ? { ...s, grant: faithImprovement }
          : s,
      ),
  );
  let valid = $derived.by(() => {
    try {
      validateCreationSelections(builder.sheet, choices, formName);
      return true;
    } catch {
      return false;
    }
  });
  let itemPreviews = $derived(
    $state.snapshot(builder.sheet.equipment ?? []).map((item) =>
      improveItem(
        item,
        choices.filter((s) => s.type === 'improvement' && s.target === item.id),
      ),
    ),
  );
  const improvements = enhancementManager.getById('rt-artifice-improvements')!;
  const controlClass =
    'w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-900 focus:ring-purple-500 focus:border-purple-500';
  function forward() {
    wizard.send('setEnhancements', $state.snapshot(choices), formName);
  }
</script>

<div class="flex flex-col gap-6 items-center w-full max-w-prose">
  <h3 class="text-2xl font-subtitle">Choose your Calling's gifts</h3>
  <p>Complete each choice below. You can edit the details on your sheet later.</p>
  {#if builder.sheet.calling?.id === 'calling-soulbearer'}
    <label class="flex flex-col gap-2 w-full max-w-md"
      >Great Soul creature
      <input
        type="text"
        placeholder="Bear, fox, eagle…"
        bind:value={formName}
        class={controlClass}
      />
    </label>
    <p>
      Your three Perks apply only while transformed. Your sheet will include a form reference; your
      human Attributes stay as chosen. Use Flying for a flying form.
    </p>
  {/if}
  {#each groups as { table, count } (table.id)}
    <section class="flex flex-col gap-3 items-center w-full">
      <h4 class="text-lg font-subtitle">{table.name} ({count})</h4>
      <p>{table.desc}</p>
      {#if table.type === 'improvement'}
        {#if builder.sheet.calling?.id === 'calling-artificer'}<p>
            The first Improvement belongs to your Tool. Distribute the other three among your
            Masterwork items; you may repeat Improvements.
          </p>{/if}
        {#each selected[table.id] as selection, index (`${table.id}-${index}`)}
          <div
            class="w-full max-w-md rounded-lg border border-purple-300 dark:border-purple-700 p-4 space-y-3"
          >
            <label class="flex flex-col gap-2"
              >Improvement {index + 1}
              <select bind:value={selection.name} class={controlClass}>
                <option value="">Choose an Improvement</option>
                {#each table.options as option (option.name)}<option value={option.name}
                    >{option.name}</option
                  >{/each}
              </select>
            </label>
            {#if selection.name}<p class="text-sm">
                {table.options.find((o) => o.name === selection.name)?.desc}
              </p>{/if}
            <label class="flex flex-col gap-2"
              >Apply to
              <select
                bind:value={selection.target}
                disabled={builder.sheet.calling?.id === 'calling-artificer' && index === 0}
                class={controlClass}
              >
                <option value="">Choose an item</option>
                {#each builder.sheet.equipment ?? [] as item (item.id)}<option value={item.id}
                    >{item.name}</option
                  >{/each}
              </select>
            </label>
            <label class="flex flex-col gap-2"
              >Describe its effect or special quality
              <input
                type="text"
                bind:value={selection.note}
                placeholder="Required for Ward, Locomoting, Detecting, or Special"
                class={controlClass}
              />
            </label>
          </div>
        {/each}
        <div class="w-full max-w-md space-y-2">
          {#each itemPreviews as item (item.id)}
            <p>
              <strong>{item.name}</strong>{#if item.damage}: d{item.damage} damage{/if}{#if item.armor}:
                {item.armor} Armor{/if}{#if item.quantity}: quantity {item.quantity}{/if}{#if item.bulky}
                (bulky){/if}
            </p>
          {/each}
          <p class="text-sm">
            Conditional bonuses and freeform effects are recorded on the item. If an Improvement
            gives an item a new kind of attack, agree its damage with the GM and edit it on the
            sheet.
          </p>
        </div>
      {:else}
        <GroupInputs
          options={table.options.map((o) => ({ ...o, type: table.type, table: table.id }))}
          max={count}
          bind:selected={() => selected[table.id], (value) => (selected[table.id] = value)}
        >
          {#snippet children({ opt })}{opt.desc}{/snippet}
        </GroupInputs>
      {/if}
    </section>
  {/each}
  {#if choices.some((s) => s.table === 'rt-devoted-boons' && s.name === 'Weapon of Faith')}
    <label class="flex flex-col gap-2 w-full max-w-md"
      >Weapon of Faith Improvement
      <select bind:value={faithImprovement} class={controlClass}>
        <option value="">Choose an Improvement</option>
        {#each improvements.options as option (option.name)}<option value={option.name}
            >{option.name}</option
          >{/each}
      </select>
    </label>
    <p class="text-sm">
      {improvements.options.find((o) => o.name === faithImprovement)?.desc} This applies to weapons you
      hold; the boon records the effect for you to apply during play.
    </p>
  {/if}
  <Button disabled={!valid} onclick={forward}>Next</Button>
</div>
