<script lang="ts">
  import { STEP, getWizard } from "../wizard";
  import { goto } from "$app/navigation";
  import { browser } from "$app/environment";
  import Button from "$lib/Button.svelte";
  import type { Ability, Character } from "$lib/types";
  import type { PageData } from "./$types";
  import { onlyEnhancement, onlyLinked } from "$lib/util/guards";
  import GroupInputs from "$lib/GroupInputs.svelte";
  import { id } from "$lib/rolling/id";

  const [wizard, builder] = getWizard();

  export let data: PageData;

  if ($wizard !== STEP.COMPANION && browser) {
    goto(`/character/new`);
  }

  let linked = $builder.choices?.filter(onlyLinked);
  let myEnhance = $builder.choices?.filter(onlyEnhancement).filter(x => x.linked) ?? [];
  let temp = '';
  let compCalling = linked && linked.length ? (temp = linked[0].id, data.companions.find(x => x.id === temp)) : undefined;
  let compEnhance = compCalling?.choices?.filter(onlyEnhancement) ?? [];
  let totalEnhance = compEnhance.length + myEnhance.length;
  const companion: Partial<Character> = { name: '' }; 
  if (compCalling) {
    companion.grit = { current: compCalling.grit ?? 3, max: compCalling.grit ?? 3 };
    companion.str = { current: compCalling.attrs?.str ?? 4, max: compCalling.attrs?.str ?? 4 };
    companion.dex = { current: compCalling.attrs?.dex ?? 4, max: compCalling.attrs?.dex ?? 4 };
    companion.wil = { current: compCalling.attrs?.wil ?? 4, max: compCalling.attrs?.wil ?? 4 };
    companion.calling = {
      id: compCalling.id,
      name: compCalling.name,
      desc: compCalling.tagline
    };
    companion.equipment = compCalling.equipment;
    companion.abilities = [];
  }
  const options = data.enhancements?.options.map(x => ({id: id(), ...x, details: data.enhancements?.type, type: 'enhance'} as Ability));
  function forward() {
    wizard.setCompanion(companion);
  }
</script>
<div class="flex flex-col gap-6 items-center">
  <h3 class="max-w-prose text-2xl font-subtitle">Build-a-Companion</h3>
  <p class="max-w-prose">Fluffy or fierce?</p>
  
  <input type="text" name="name" placeholder="Name" bind:value={companion.name} class="rounded-full dark:bg-gray-900 dark:text-white focus:ring-purple-500 focus:border-purple-500 w-full">
  
  {#if options && totalEnhance}
  <p class="max-w-prose">{data.enhancements?.desc} ({totalEnhance})</p>
  <GroupInputs {options} max={totalEnhance} bind:selected={companion.abilities} let:opt>
  {opt.desc}
  </GroupInputs>
  {/if}
  <Button on:click={forward}>Next</Button>
</div>