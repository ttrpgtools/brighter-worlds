<script lang="ts">
  import { builder, STEP, wizard } from "../wizard";
  import { goto } from "$app/navigation";
  import { browser } from "$app/environment";
  import Button from "$lib/Button.svelte";
  import type { Ritual, Spell } from "$lib/types";
  import type { PageData } from "./$types";
  import { onlyMagic } from "$lib/util/guards";
  import GroupInputs from "$lib/GroupInputs.svelte";

  export let data: PageData;

  if ($wizard !== STEP.MAGIC && browser) {
    goto(`/character/new`);
  }
  const spellsNeeded = $builder.choices?.filter(onlyMagic).filter(x => x.type === 'spell').length ?? 0;
  const ritualsNeeded = $builder.choices?.filter(onlyMagic).filter(x => x.type === 'ritual').length ?? 0;
  let spells: Spell[] = [];
  let rituals: Ritual[] = [];
  function forward() {
    wizard.setMagic(spells, rituals);
  }
</script>
<div class="flex flex-col gap-6 items-center">
  <h3 class="max-w-prose text-lg">Increase Your Arcane Might!</h3>
  <p class="max-w-prose">Select spells and rituals as appropriate based on your Calling.</p>
  {#if spellsNeeded > 0}
    <div class="flex flex-col gap-2 items-center">
      <h4 class="text-lg">Spells ({spellsNeeded})</h4>
      <GroupInputs options={data.spells} max={spellsNeeded} bind:selected={spells} let:opt>
      {opt.desc}
      </GroupInputs>
    </div>
  {/if}

  {#if ritualsNeeded > 0}
    <div class="flex flex-col gap-2 items-center">
      <h4 class="text-lg">Rituals ({ritualsNeeded})</h4>
      <GroupInputs options={data.rituals} max={ritualsNeeded} bind:selected={rituals} let:opt>
      {opt.desc}
      </GroupInputs>
    </div>
  {/if}

  <Button on:click={forward}>Next</Button>
</div>