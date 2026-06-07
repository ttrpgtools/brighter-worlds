<script lang="ts">
  import { STEP, getWizard, guardWizardStep } from '../wizard.svelte';
  import Button from '$lib/ui/button.svelte';
  import type { CallingEnhancement } from '$lib/types';
  import type { PageData } from './$types';
  import { onlyEnhancement } from '$lib/util/guards';
  import { defined } from '$lib/util/array';
  import GroupInputs from '$lib/GroupInputs.svelte';

  const [wizard, builder] = getWizard();

  interface Props {
    data: PageData;
  }

  let { data }: Props = $props();

  guardWizardStep(wizard, STEP.ENHANCEMENTS);
  const enhancements: CallingEnhancement[][] = $state([]);
  const groupedChoices =
    builder.sheet.choices
      ?.filter(onlyEnhancement)
      .filter((x) => !x.linked)
      .reduce((p, c) => p.set(c.table, (p.get(c.table) ?? 0) + 1), new Map<string, number>()) ??
    new Map<string, number>();
  const etables = Array.from(groupedChoices.keys() ?? [])
    .map((x) => data.list.find((y) => y.id === x))
    .filter(defined);
  function forward() {
    wizard.send('setEnhancements', enhancements.flat(1));
  }
</script>

<div class="flex flex-col gap-6 items-center">
  <h3 class="max-w-prose text-2xl font-subtitle">Enhance!</h3>
  <p class="max-w-prose">Select certain enhancements based on your Calling abilities.</p>

  {#each etables as et, eti (et.id)}
    <div class="flex flex-col gap-2 items-center">
      <h4 class="text-lg">{et.name} ({groupedChoices.get(et.id) ?? 1})</h4>
      <p class="max-w-prose">{et.desc}</p>
      <GroupInputs
        options={et.options.map((x) => ({ ...x, type: et.type }))}
        max={groupedChoices.get(et.id) ?? 1}
        bind:selected={() => enhancements[eti] ?? [], (enh) => (enhancements[eti] = enh)}
      >
        {#snippet children({ opt })}
          {opt.desc}
        {/snippet}
      </GroupInputs>
    </div>
  {/each}

  <Button onclick={forward}>Next</Button>
</div>
