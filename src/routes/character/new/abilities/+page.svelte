<script lang="ts">
  import { STEP, getWizard } from "../wizard";
  import { goto } from "$app/navigation";
  import { browser } from "$app/environment";
  import Button from "$lib/Button.svelte";
  import type { PageData } from "./$types";
  import GroupInputs from "$lib/GroupInputs.svelte";
  import type { Ability, HasChoices } from "$lib/types";

  const [wizard, builder] = getWizard();

  export let data: PageData;
  $: advanced = data.list.find(x => x.id === $builder.calling?.id)?.abilities.filter(x => x.type === 'advanced') ?? [];
  let chosen: (Ability & HasChoices)[] = [];

  if ($wizard !== STEP.ABILITIES && browser) {
    goto(`/character/new`);
  }

  function forward() {
    wizard.setAbilities(chosen);
  }
</script>
<div class="flex flex-col gap-6 items-center">
  <h3 class="max-w-prose text-center mb-4 text-2xl font-subtitle">Choose your starting advanced ability</h3>
  <p class="max-w-prose text-left mb-4">Each Calling has four Advanced Abilities that show ways your character might grow or develop as they progress through the world.</p>
  <p class="max-w-prose text-left mb-6">Your first Advanced Ability is free. You may choose it now to start the game with, or save it for use later. The other Advanced Abilities can be unlocked by spending XP earned during play.</p>
  <GroupInputs options={advanced} bind:selected={chosen} max={1} let:opt>
    {@html opt.desc}
  </GroupInputs>

  <Button on:click={forward}>Next</Button>
</div>