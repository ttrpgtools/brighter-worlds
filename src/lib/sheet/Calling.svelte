<script lang="ts">
  import Card from "$lib/Card.svelte";
  import { Die } from "$lib/dice";
  import type { Ability, Calling, CallingEnhancements, CharacterChoice, Entity, HasChoices } from "$lib/types";
  import { onEnter } from "$lib/util/handlers";
  import { capitalize } from "$lib/util/string";
  import { toggleHeight } from "$lib/util/toggle-height";
  import CallingAbilityDialog from "./CallingAbilityDialog.svelte";
  import CallingDetailDialog from "./CallingDetailDialog.svelte";
  import RollSelector from "./RollSelector.svelte";

  export let calling: Entity;
  export let abilities: Ability[];
  export let callingList: Calling[];
  export let enhancements: CallingEnhancements[];

  let callingDialog: CallingDetailDialog;
  let abilityDialog: CallingAbilityDialog;

  let callingData: Calling | undefined;
  let advancedAbilities: (Ability & HasChoices)[];
  let availableAbilities: (Ability & HasChoices)[];
  $: {
    callingData = callingList.find(x => x.id === calling.id);
    advancedAbilities = (callingData?.abilities ?? []).filter(x => x.type === 'advanced');
  }
  $: {
    availableAbilities = advancedAbilities.filter(x => !abilities.some(y => y.id === x.id));
  }
</script>
{#if callingData != null}
  <CallingDetailDialog calling={callingData} bind:this={callingDialog} />
  <CallingAbilityDialog bind:abilities bind:this={abilityDialog} {availableAbilities} {enhancements} />
{/if}
<Card class="md:h-[25rem]">
  <div class="flex items-center gap-2 w-full" slot="header">
    <h3 class="text-xl font-subtitle leading-6">{calling.name}</h3>
    <p class="text-gray-500 relative">(Calling)</p>
    <div class="flex-1 flex items-center justify-end gap-2">
      {#if callingDialog && callingData?.desc}<button type="button" on:click={() => callingDialog.open()} class="relative inline-flex items-center rounded-full bg-purple-300 dark:bg-purple-700 p-1 font-medium shadow-sm hover:bg-purple-200 dark:hover:bg-purple-800 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-900"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 192 512" class="w-4 h-4"><path fill="currentColor" d="M144 80c0 26.5-21.5 48-48 48s-48-21.5-48-48s21.5-48 48-48s48 21.5 48 48zM0 224c0-17.7 14.3-32 32-32H96c17.7 0 32 14.3 32 32V448h32c17.7 0 32 14.3 32 32s-14.3 32-32 32H32c-17.7 0-32-14.3-32-32s14.3-32 32-32H64V256H32c-17.7 0-32-14.3-32-32z"/></svg></button>{/if}
      {#if abilityDialog}<button type="button" on:click={() => abilityDialog.add()} class="relative inline-flex items-center rounded-full bg-purple-300 dark:bg-purple-700 p-1 font-medium shadow-sm hover:bg-purple-200 dark:hover:bg-purple-800 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-900"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" class="h-4 w-4"><path fill="currentColor" d="M256 80c0-17.7-14.3-32-32-32s-32 14.3-32 32V224H48c-17.7 0-32 14.3-32 32s14.3 32 32 32H192V432c0 17.7 14.3 32 32 32s32-14.3 32-32V288H400c17.7 0 32-14.3 32-32s-14.3-32-32-32H256V80z"/></svg></button>{/if}
    </div>
  </div>
  <div class="flow-root">
    <ul class="-my-5 divide-y divide-gray-200 dark:divide-gray-600">
      {#if calling.desc}
      <li class="py-3">
        <div class="flex items-center space-x-4 h-6">
          <div class="min-w-0 flex-1 flex gap-4">
            <p class="text-sm font-medium">{calling.desc}</p>
          </div>
        </div>
      </li>
      {/if}
      {#each abilities as ability (ability.id)}
      <li class="py-3">
        <div class="flex items-center space-x-4 h-6">
          <div class="min-w-0 flex-1 flex gap-4">
            <button type="button" class="truncate select-text text-sm font-medium cursor-pointer" title={ability.name} on:click={() => abilityDialog.edit(ability.id)} on:keydown={onEnter(() => abilityDialog.edit(ability.id))}>{ability.name}</button>
          </div>
          <div class="flex gap-2 items-center">
            <span class="inline-flex items-center rounded-full dark:bg-purple-100 px-2.5 py-0.5 text-xs font-medium dark:text-purple-800 bg-purple-800 text-purple-100">{capitalize(ability.type === 'enhance' || ability.type === 'companion' ? (ability.details ?? '') : ability.type)}</span>
            {#if ability.damage}<RollSelector label={ability.name} die={ability.damage} direction={-1} on:roll let:events><button use:events type="button" class="inline-flex items-center text-sm font-medium leading-5"><Die which={ability.damage}/></button></RollSelector>{/if}
          </div>
        </div>
        {#if ability.desc}<p use:toggleHeight class="text-sm text-gray-600 dark:text-gray-400 overflow-hidden">{@html ability.desc}</p>{/if}
      </li>
      {:else}
      <li class="py-3 italic text-gray-600 dark:text-gray-400">No abilities found... odd.</li>
      {/each}
    </ul>
  </div>
</Card>