<script lang="ts">
  import { STEP, getWizard, guardWizardStep } from '../wizard.svelte';
  import Button from '$lib/ui/button.svelte';
  import type { PageData } from './$types';
  import type { CallingEnhancement } from '$lib/types';
  import GroupInputs from '$lib/GroupInputs.svelte';
  import Toggle from '$lib/ui/toggle.svelte';
  import { buildCompanion } from '$lib/data/character-creation';

  const [wizard, builder] = getWizard();
  let { data }: { data: PageData } = $props();
  guardWizardStep(wizard, STEP.COMPANION);
  let template = $derived(
    data.companions.find((c) =>
      builder.sheet.choices?.some((choice) => choice.choose === 'linked' && choice.id === c.id),
    ),
  );
  let extraPerks = $derived(
    builder.sheet.choices?.filter((c) => c.choose === 'enhancement' && c.linked).length ?? 0,
  );
  let count = $derived(
    (template?.choices?.filter((c) => c.choose === 'enhancement').length ?? 0) + extraPerks,
  );
  let name = $state('');
  let flies = $state(false);
  let selected: CallingEnhancement[] = $state([]);
  let preview = $derived.by(() => {
    if (!template) return;
    try {
      return buildCompanion(
        $state.snapshot(template),
        name,
        selected.map((s) => s.name),
        flies,
        extraPerks,
      );
    } catch {
      return;
    }
  });
  function forward() {
    if (template)
      wizard.send(
        'setCompanion',
        template,
        name,
        selected.map((s) => s.name),
        flies,
      );
  }
</script>

<div class="flex flex-col gap-6 items-center w-full max-w-prose">
  <h3 class="text-2xl font-subtitle">Create your {template?.name.toLowerCase() ?? 'companion'}</h3>
  <label class="flex flex-col gap-2 w-full max-w-md"
    >Name
    <input
      type="text"
      bind:value={name}
      class="rounded-md dark:bg-gray-900 border-gray-300 dark:border-gray-600 focus:ring-purple-500 focus:border-purple-500"
    />
  </label>
  <div class="flex gap-2 items-center"><Toggle bind:value={flies} /> This creature can fly</div>
  <p>
    Choose {count} different Perks. A flying creature needs Flying. Attribute, Grit, attack and Armor
    changes will be included on its sheet.
  </p>
  {#if data.enhancements}
    <GroupInputs
      options={data.enhancements.options.map((o) => ({ ...o, type: 'perk' }))}
      max={count}
      bind:selected
    >
      {#snippet children({ opt })}{opt.desc}{/snippet}
    </GroupInputs>
  {/if}
  {#if flies && !selected.some((p) => p.name === 'Flying')}<p
      class="text-amber-700 dark:text-amber-300"
    >
      Choose the Flying Perk for this creature.
    </p>{/if}
  {#if preview}
    <div class="rounded-lg border border-purple-400 p-4 w-full max-w-md space-y-2">
      <p>
        <strong>{name}</strong>: STR d{preview.str?.max}, DEX d{preview.dex?.max}, WIL d{preview.wil
          ?.max}, {preview.grit?.max} Grit.
      </p>
      {#each preview.equipment ?? [] as item (item.id)}<p>
          {item.name}{#if item.damage}: d{item.damage}{/if}{#if item.armor}: {item.armor} Armor{/if}
        </p>{/each}
      <p class="text-sm">
        Unusual senses, skills, and attack effects are recorded as Perks for you to describe with
        the GM.
      </p>
    </div>
  {/if}
  <Button disabled={!preview} onclick={forward}>Next</Button>
</div>
