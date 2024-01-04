<script lang="ts">
  import Button from "$lib/Button.svelte";
  import DialogBase from "$lib/DialogBase.svelte";
  import type { Calling } from "$lib/types";
  export let calling: Calling;

  let comp: DialogBase<undefined>;
  export async function open() {
    await comp.open<undefined>();
  }

  function closeMe() {
    comp.close();
  }

  $: coreAbility = calling.abilities.filter(x => x.type === 'core');
  $: advancedAbilities = calling.abilities.filter(x => x.type === 'advanced');
</script>
<DialogBase bind:this={comp} maxWidth="max-w-[65ch]">
  <div class="prose dark:prose-invert prose-purple max-h-[calc(100vh-10rem)] -mx-6 px-6">
    <h2 class="text-3xl mb-2 font-subtitle text-purple-500">{calling.name}</h2>
    {@html calling.desc}
    {#each coreAbility as ca}
    <h3 class="text-xl">Core Ability - {ca.name}</h3>
    {@html ca.desc}
    {/each}
    
    <h3 class="text-xl">Advanced Abilities</h3>
    <p class="">
      Spend 2 XP to unlock your first Advanced Ability. Each subsequent Advanced Ability’s cost increases by two. (2 XP → 4 XP → 6 XP → 8 XP).
    </p>
    <ul>
      {#each advancedAbilities as aa}
      <li class=""><strong class="mr-1">{aa.name}</strong>{@html aa.desc}</li>
      {/each}
    </ul>
  </div>
  <div class="mt-5 text-center mb-1" slot="footer">
    <Button on:click={() => closeMe()}>Close</Button>
  </div>
</DialogBase>