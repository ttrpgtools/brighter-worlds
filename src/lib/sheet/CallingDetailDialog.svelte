<script lang="ts">
  import Button from "$lib/Button.svelte";
  import DialogBase from "$lib/DialogBase.svelte";
  import type { Calling } from "$lib/types";
  export let calling: Calling;

  let comp: DialogBase<undefined>;
  export async function open() {
    await comp.open<undefined>();
  }

  $: coreAbility = calling.abilities.filter(x => x.type === 'core');
  $: advancedAbilities = calling.abilities.filter(x => x.type === 'advanced');
</script>
<DialogBase let:close bind:this={comp} maxWidth="max-w-[65ch]">
  <div class="flex flex-col prose dark:prose-invert prose-purple max-h-[calc(100vh-10rem)] overflow-y-scroll -mx-6 px-6">
    <h2 class="text-3xl mb-2 font-subtitle text-purple-500">{calling.name}</h2>
    <p class="italic">
      {calling.desc}
    </p>
    <h3 class="text-xl">Core Ability</h3>
    {#each coreAbility as ca}
    <p class="">
      <strong class="mr-1">{ca.name}</strong>{@html ca.desc}
    </p>
    {/each}
    
    <h3 class="text-xl">Advanced Abilities</h3>
    <p class="">
      Pick one Advanced Ability at character creation. Gain more by spending XP equal to twice the number of Advanced Abilities you currently have (0 XP → 2 XP → 4 XP → 6 XP).
    </p>
    <ul>
      {#each advancedAbilities as aa}
      <li class=""><strong class="mr-1">{aa.name}</strong>{@html aa.desc}</li>
      {/each}
    </ul>
  </div>
  <div class="mt-5 text-center mb-1">
    <Button on:click={() => close()}>Close</Button>
  </div>
</DialogBase>