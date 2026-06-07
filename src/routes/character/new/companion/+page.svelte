<script lang="ts">
  import { STEP, getWizard, guardWizardStep } from '../wizard.svelte';
  import Button from '$lib/ui/button.svelte';
  import type { Ability, Character } from '$lib/types';
  import type { PageData } from './$types';
  import { onlyEnhancement, onlyLinked } from '$lib/util/guards';
  import GroupInputs from '$lib/GroupInputs.svelte';
  import { id } from '$lib/rolling/id';
  import { untrack } from 'svelte';

  const [wizard, builder] = getWizard();

  interface Props {
    data: PageData;
  }

  let { data }: Props = $props();

  guardWizardStep(wizard, STEP.COMPANION);

  let linked = $derived(builder.sheet.choices?.filter(onlyLinked));
  let myEnhance = $derived(
    builder.sheet.choices?.filter(onlyEnhancement).filter((x) => x.linked) ?? [],
  );
  const companionData = untrack(() => data.companions);
  const enhancementData = untrack(() => data.enhancements);
  let compCalling = $derived(
    linked?.length ? companionData.find((x) => x.id === linked[0].id) : undefined,
  );
  let compEnhance = $derived(compCalling?.choices?.filter(onlyEnhancement) ?? []);
  let totalEnhance = $derived(compEnhance.length + myEnhance.length);
  const companion: Partial<Character> & { name: string; abilities: Ability[] } = $state({
    name: '',
    abilities: [],
  });
  let initializedCallingId = $state<string>();
  $effect(() => {
    if (!compCalling || initializedCallingId === compCalling.id) return;
    companion.grit = { current: compCalling.grit ?? 3, max: compCalling.grit ?? 3 };
    companion.str = { current: compCalling.attrs?.str ?? 4, max: compCalling.attrs?.str ?? 4 };
    companion.dex = { current: compCalling.attrs?.dex ?? 4, max: compCalling.attrs?.dex ?? 4 };
    companion.wil = { current: compCalling.attrs?.wil ?? 4, max: compCalling.attrs?.wil ?? 4 };
    companion.calling = {
      id: compCalling.id,
      name: compCalling.name,
      desc: compCalling.tagline,
    };
    companion.equipment = compCalling.equipment;
    companion.abilities = [];
    initializedCallingId = compCalling.id;
  });
  const options = enhancementData?.options.map(
    (x) => ({ id: id(), ...x, details: enhancementData?.type, type: 'enhance' }) as Ability,
  );
  function forward() {
    wizard.send('setCompanion', companion);
  }
</script>

<div class="flex flex-col gap-6 items-center">
  <h3 class="max-w-prose text-2xl font-subtitle">Build-a-Companion</h3>
  <p class="max-w-prose">Fluffy or fierce?</p>

  <input
    type="text"
    name="name"
    placeholder="Name"
    bind:value={companion.name}
    class="rounded-full dark:bg-gray-900 dark:text-white focus:ring-purple-500 focus:border-purple-500 w-full"
  />

  {#if options && totalEnhance}
    <p class="max-w-prose">{enhancementData?.desc} ({totalEnhance})</p>
    <GroupInputs {options} max={totalEnhance} bind:selected={companion.abilities}>
      {#snippet children({ opt })}
        {opt.desc}
      {/snippet}
    </GroupInputs>
  {/if}
  <Button onclick={forward}>Next</Button>
</div>
