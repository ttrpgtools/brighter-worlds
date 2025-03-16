<script lang="ts">
  import Card from '$lib/ui/card.svelte';
  import { Die } from '$lib/dice';
  import type {
    Ability,
    Calling,
    CallingEnhancements,
    CharacterChoice,
    DieRollSet,
    Entity,
    HasChoices
  } from '$lib/types';
  import { onEnter } from '$lib/util/handlers';
  import { capitalize } from '$lib/util/string';
  import { toggleHeight } from '$lib/util/toggle-height';
  import CallingAbilityDialog from './CallingAbilityDialog.svelte';
  import CallingDetailDialog from './CallingDetailDialog.svelte';
  import RollSelector from './RollSelector.svelte';
  import Button from '$lib/ui/button.svelte';

  interface Props {
    calling: Entity;
    abilities: Ability[];
    callingList: Calling[];
    enhancements: CallingEnhancements[];
    onroll?: (data: { dice: DieRollSet; name: string }) => void;
  }

  let { calling, abilities = $bindable(), callingList, enhancements, onroll }: Props = $props();

  let callingDialog: CallingDetailDialog | undefined = $state();
  let abilityDialog: CallingAbilityDialog | undefined = $state();

  let callingData: Calling | undefined = $derived(callingList.find((x) => x.id === calling.id));
  let advancedAbilities: (Ability & HasChoices)[] = $derived(
    (callingData?.abilities ?? []).filter((x) => x.type === 'advanced')
  );
  let availableAbilities: (Ability & HasChoices)[] = $derived(
    advancedAbilities.filter((x) => !abilities.some((y) => y.id === x.id))
  );
</script>

{#if callingData != null}
  <CallingDetailDialog calling={callingData} bind:this={callingDialog} />
  <CallingAbilityDialog
    bind:abilities
    bind:this={abilityDialog}
    {availableAbilities}
    {enhancements}
  />
{/if}
<Card class="md:h-[25rem]">
  {#snippet header()}
    <div class="flex items-center gap-2 w-full">
      <h3 class="text-xl font-subtitle leading-6">{calling.name}</h3>
      <p class="text-gray-500 relative">(Calling)</p>
      <div class="flex-1 flex items-center justify-end gap-2">
        {#if callingDialog && callingData?.desc}
          <Button
            class="border-0"
            icon="info"
            size="tight"
            iconClass="size-4"
            onclick={() => callingDialog?.open()}
          />
        {/if}
        {#if abilityDialog}
          <Button
            class="border-0"
            icon="plus"
            size="tight"
            iconClass="size-4"
            onclick={() => abilityDialog?.add()}
          />
        {/if}
      </div>
    </div>
  {/snippet}
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
              <button
                type="button"
                class="truncate select-text text-sm font-medium cursor-pointer"
                title={ability.name}
                onclick={() => abilityDialog?.edit(ability.id)}
                onkeydown={onEnter(() => abilityDialog?.edit(ability.id))}>{ability.name}</button
              >
            </div>
            <div class="flex gap-2 items-center">
              <span
                class="inline-flex items-center rounded-full dark:bg-purple-100 px-2.5 py-0.5 text-xs font-medium dark:text-purple-800 bg-purple-800 text-purple-100"
                >{capitalize(
                  ability.type === 'enhance' || ability.type === 'companion'
                    ? (ability.details ?? '')
                    : ability.type
                )}</span
              >
              {#if ability.damage}<RollSelector
                  label={ability.name}
                  die={ability.damage}
                  direction={-1}
                  onroll={(x) => onroll?.(x)}
                  >{#snippet children({ events, damage })}
                    <button
                      use:events
                      type="button"
                      class="inline-flex items-center text-sm font-medium leading-5"
                      ><Die which={damage} /></button
                    >
                  {/snippet}
                </RollSelector>{/if}
            </div>
          </div>
          {#if ability.desc}<p
              use:toggleHeight
              class="text-sm text-gray-600 dark:text-gray-400 overflow-hidden"
            >
              {@html ability.desc}
            </p>{/if}
        </li>
      {:else}
        <li class="py-3 italic text-gray-600 dark:text-gray-400">No abilities found... odd.</li>
      {/each}
    </ul>
  </div>
</Card>
