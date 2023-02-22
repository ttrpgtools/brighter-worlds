<script lang="ts">
  import { builder, STEP, wizard } from "../wizard";
  import { goto } from "$app/navigation";
  import { browser } from "$app/environment";
  import Button from "$lib/Button.svelte";
  import type { PageData } from "./$types";
  import GroupInputs from "$lib/GroupInputs.svelte";
  import type { Ability, HasChoices } from "$lib/types";

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
  <h3 class="max-w-prose text-center mb-4 text-lg">Choose your starting advanced ability</h3>
  <p class="max-w-prose text-center mb-6">You can get more later with XP</p>
  <GroupInputs options={advanced} bind:selected={chosen} max={1} let:opt>
    {@html opt.desc}
  </GroupInputs>

  <Button on:click={forward}>Next</Button>
</div>