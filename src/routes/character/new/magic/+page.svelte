<script lang="ts">
  import { STEP, getWizard } from '../wizard';
  import { goto } from '$app/navigation';
  import { browser } from '$app/environment';
  import Button from '$lib/ui/button.svelte';
  import type { Ritual, Spell } from '$lib/types';
  import type { PageData } from './$types';
  import { onlyMagic } from '$lib/util/guards';
  import GroupInputs from '$lib/GroupInputs.svelte';
  import { partition } from '$lib/util/array';

  const [wizard, builder] = getWizard();

  interface Props {
    data: PageData;
  }

  let { data }: Props = $props();

  if (wizard.current !== STEP.MAGIC && browser) {
    goto(`/character/new`);
  }
  const spellsNeeded =
    $builder.choices?.filter(onlyMagic).filter((x) => x.type === 'spell').length ?? 0;
  const ritualsNeeded =
    $builder.choices?.filter(onlyMagic).filter((x) => x.type === 'ritual').length ?? 0;
  let spells: Spell[] = $state([]);
  let rituals: Ritual[] = $state([]);
  function forward() {
    wizard.send('setMagic', spells, rituals);
  }
  let spellPartition = $derived(
    partition(data.spells, (x) => !$builder.spells?.some((y) => y.id === x.id))
  );
  let ritualPartition = $derived(
    partition(data.rituals, (x) => !$builder.rituals?.some((y) => y.id === x.id))
  );
</script>

<div class="flex flex-col gap-6 items-center">
  <h3 class="max-w-prose text-lg">Increase Your Arcane Might!</h3>
  <p class="max-w-prose">Select spells and rituals as appropriate based on your Calling.</p>
  {#if spellsNeeded > 0}
    <div class="flex flex-col gap-2 items-center">
      <h4 class="text-lg">Spells ({spellsNeeded})</h4>
      {#if spellPartition[1].length}
        <div class="text-gray-600 dark:text-gray-400 text-sm">
          <p>
            (Already assigned:
            {#each spellPartition[1] as chosen, ci}
              <span class="ml-1"
                >{chosen.name}{#if ci !== spellPartition[1].length - 1},
                {:else}){/if}</span
              >
            {/each}
          </p>
        </div>
      {/if}
      <GroupInputs
        options={spellPartition[0]}
        max={spellsNeeded}
        bind:selected={spells}
        hideUnavailable={true}
      >
        {#snippet children({ opt })}
          {opt.desc}
        {/snippet}
      </GroupInputs>
    </div>
  {/if}

  {#if ritualsNeeded > 0}
    <div class="flex flex-col gap-2 items-center">
      <h4 class="text-lg">Rituals ({ritualsNeeded})</h4>
      {#if spellPartition[1].length}
        <div class="text-gray-600 dark:text-gray-400 text-sm">
          <p>
            (Already assigned:
            {#each ritualPartition[1] as chosen, ci}
              <span class="ml-1"
                >{chosen.name}{#if ci !== ritualPartition[1].length - 1},
                {:else}){/if}</span
              >
            {/each}
          </p>
        </div>
      {/if}
      <GroupInputs
        options={ritualPartition[0]}
        max={ritualsNeeded}
        bind:selected={rituals}
        hideUnavailable={true}
      >
        {#snippet children({ opt })}
          {opt.desc}
        {/snippet}
      </GroupInputs>
    </div>
  {/if}

  <Button onclick={forward}>Next</Button>
</div>
