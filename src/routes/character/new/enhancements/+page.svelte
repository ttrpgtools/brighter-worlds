<script lang="ts">
  import { STEP, getWizard } from "../wizard";
  import { goto } from "$app/navigation";
  import { browser } from "$app/environment";
  import Button from "$lib/Button.svelte";
  import type { CallingEnhancement } from "$lib/types";
  import type { PageData } from "./$types";
  import { onlyEnhancement } from "$lib/util/guards";
  import { defined } from "$lib/util/array";
  import GroupInputs from "$lib/GroupInputs.svelte";

  const [wizard, builder] = getWizard();

  export let data: PageData;

  if ($wizard !== STEP.ENHANCEMENTS && browser) {
    goto(`/character/new`);
  }
  const enhancements: CallingEnhancement[][] = [];
  const groupedChoices = $builder.choices?.filter(onlyEnhancement).filter(x => !x.linked).reduce((p, c) => p.set(c.table, (p.get(c.table) ?? 0) + 1), new Map<string, number>()) ?? new Map<string, number>();
  const etables = Array.from(groupedChoices.keys() ?? []).map(x => data.list.find(y => y.id === x)).filter(defined);
  function forward() {
    wizard.setEnhancements(enhancements.flat(1));
  }
</script>
<div class="flex flex-col gap-6 items-center">
  <h3 class="max-w-prose text-2xl font-subtitle">Enhance!</h3>
  <p class="max-w-prose">Select certain enhancements based on your Calling abilities.</p>

  {#each etables as et, eti (et.id)}
    <div class="flex flex-col gap-2 items-center">
      <h4 class="text-lg">{et.name} ({groupedChoices.get(et.id)??1})</h4>
      <p class="max-w-prose">{et.desc}</p>
      <GroupInputs options={et.options.map(x => ({...x, type: et.type}))} max={groupedChoices.get(et.id)??1} bind:selected={enhancements[eti]} let:opt>
      {opt.desc}
      </GroupInputs>
    </div>
  {/each}

  <Button on:click={forward}>Next</Button>
</div>