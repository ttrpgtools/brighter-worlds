<script lang="ts">
  import DiceDialog from '$lib/DiceDialog.svelte';
  import { roll } from '$lib/rolling/roll';
  import Name from "$lib/sheet/Name.svelte";
  import type { DamageDetails, DieValue, Encounter, NpcInstance } from '$lib/types';
  import Attribute from '$lib/sheet/Attribute.svelte';
  import Grit from '$lib/sheet/Grit.svelte';
  import MenuLink from "$lib/MenuLink.svelte";
  import { encounters, getNpcInstance } from '$lib/data/encounter-manager';
  import { onMount } from 'svelte';
  import DamageDialog from '$lib/sheet/DamageDialog.svelte';
  import Roller from '$lib/sheet/Roller.svelte';
  import type { PageData } from './$types';
  import AutoTextarea from '$lib/AutoTextarea.svelte';
  import { Die } from '$lib/dice';
  import NpcDialog from './NpcDialog.svelte';
  import { append } from '$lib/util/array';
  import RollSelector from '$lib/sheet/RollSelector.svelte';
  import { toggleHeight } from '$lib/util/toggle-height';
  import Card from '$lib/Card.svelte';

  export let data: PageData;

  let dice: DiceDialog;
  let damageDialog: DamageDialog;
  let npcDialog: NpcDialog;

  const list = encounters.list;

  onMount(() => {
    list.load();
  });
  
  function persist() {
    $list = $list;
  }
  
  function showRoll(sides: DieValue[], label: string = '') {
    const [first, second] = sides;
    let interim = roll(first);
    if (second) {
      const secondValue = roll(second);
      console.log('first', interim, 'second', secondValue);
      if (secondValue > interim) {
        interim = secondValue;
      }
    }
    label = label || `d${sides}`;
    dice.show(`${interim}`, sides, label);
    console.log(`${label} =`, interim);
  }
  
  function save(ev: CustomEvent<{ dice: DieValue[] }>, stat: string) {
    const dice = ev.detail.dice;
    const label = `${stat} Save`;
    showRoll(dice, label);
  }
  
  function rollAttack(ev: CustomEvent<{ dice: DieValue[], name: string }>) {
    const dice = ev.detail.dice;
    const name = ev.detail.name;
    showRoll(dice, name);
  }

  async function takeDamage(ev: CustomEvent<{ type: 'str' | 'dex' | 'wil' }>, eindex: number, nindex: number) {
    const type = ev.detail.type;
    const npc = $list[eindex].npcs[nindex];
    const chinfo: DamageDetails = {
      type,
      armor: npc.armor || 0,
      statuses: new Set(npc.status ? [npc.status] : []),
      grit: npc.grit.current,
      die: npc[type].current,
    };
    
    const results = await damageDialog.getDamage(chinfo);

    if (results == null) return;

    if (results.statuses != null) {
      $list[eindex].npcs[nindex].status = results.statuses.size > 0 ? Array.from(results.statuses.values())[0] : '';
    }
    if (results.grit != null) {
      $list[eindex].npcs[nindex].grit.current = results.grit;
    }
    if (results.die != null) {
      $list[eindex].npcs[nindex][type].current = results.die;
    }
    dice.show('Damage', results.dice, results.msg);
  }

  function addEncounter() {
    encounters.create();
  }

  async function addNpc(encounter: number) {
    const stats = await npcDialog.select();
    console.log('NPC', stats);
    if (stats) {
      const instance = getNpcInstance(stats);
      console.log('Instance', instance);
      $list[encounter].npcs = append($list[encounter].npcs, instance);
    }
  }

</script>
<svelte:head>
  <title>Encounters :: Brighter Worlds Online</title>
</svelte:head>
<NpcDialog npcList={data.npcs} bind:this={npcDialog} />
<DiceDialog bind:this={dice} />
<DamageDialog bind:this={damageDialog} />
<Roller on:roll={(ev) => showRoll([ev.detail])} />
<main class="p-4 sm:p-8 flex flex-col items-center gap-2">
  <h2 class="font-title text-4xl text-center">Encounters</h2>
  <div class="font-symbol text-6xl">A</div>
{#each $list as encounter, eindex}
<details class="w-full max-w-4xl" open>
  <summary><div class="inline-block text-3xl font-subtitle min-w-[2rem]">{encounter.name || `(unnamed)`}</div></summary>
  <div class="flex flex-col gap-4">
    <input type="text" placeholder="Name" bind:value={encounter.name} class="rounded-full dark:bg-gray-900 dark:text-white focus:ring-purple-500 focus:border-purple-500">
    <AutoTextarea bind:value={encounter.notes} maxRows={12} minRows={5}></AutoTextarea>
    <div class="flex items-center gap-4">
      <h3 class="text-2xl font-subtitle">NPCs</h3>
      <div>
        <button type="button" on:click={() => addNpc(eindex)} class="relative inline-flex items-center rounded-full bg-purple-300 dark:bg-purple-700 p-1 font-medium shadow-sm hover:bg-purple-200 dark:hover:bg-purple-800 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-900"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" class="h-4 w-4"><path fill="currentColor" d="M256 80c0-17.7-14.3-32-32-32s-32 14.3-32 32V224H48c-17.7 0-32 14.3-32 32s14.3 32 32 32H192V432c0 17.7 14.3 32 32 32s32-14.3 32-32V288H400c17.7 0 32-14.3 32-32s-14.3-32-32-32H256V80z"/></svg></button>
      </div>
    </div>
  </div>
  <div class="flex flex-col gap-4">
  {#each encounter.npcs as npc, nin}
  {@const hasAttacks = Array.isArray(npc.attacks) && npc.attacks.length > 0}
  
  <div class="relative flex flex-col gap-2">
    <input type="text" class="w-full border-0 dark:bg-gray-900 placeholder-shown:bg-gray-100 dark:placeholder-shown:bg-black focus:border-purple-600 focus:ring-0 font-title text-3xl p-4 rounded-lg h-full" placeholder="Name" bind:value={npc.name}>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Card>
        <div class="flex flex-col gap-4">
          <Grit bind:value={npc.grit} isDeprived={false} isBurdened={false} />
          <Attribute name="STR" value={npc.str} on:roll={(ev) => save(ev, 'STR')} on:damage={(ev) => takeDamage(ev, eindex, nin)} on:change={persist}/>
          <Attribute name="DEX" value={npc.dex} on:roll={(ev) => save(ev, 'DEX')} on:damage={(ev) => takeDamage(ev, eindex, nin)} on:change={persist}/>
          <Attribute name="WIL" value={npc.wil} on:roll={(ev) => save(ev, 'WIL')} on:damage={(ev) => takeDamage(ev, eindex, nin)} on:change={persist}/>
          <div>{npc.status}</div>
        </div>
      </Card>
      
      <Card>

      
      <div>
        <ul class="-my-5 divide-y divide-gray-200 dark:divide-gray-600">
          {#if hasAttacks}
          {#each npc.attacks as attack (attack.id)}
          <li class="py-3">
            <div class="flex items-center space-x-4">
              <div class="min-w-0 flex-1 flex gap-4">
                <p class="truncate text-sm font-medium" title={attack.name}>{attack.name}</p>
              </div>
              <div class="flex gap-2 items-center">
                {#if attack.damage}<RollSelector label={attack.name} die={attack.damage} direction={-1} on:roll={rollAttack} let:events><button use:events type="button" class="inline-flex items-center text-sm font-medium leading-5"><Die which={attack.damage}/></button></RollSelector>{/if}
              </div>
            </div>
            {#if attack.desc}<p use:toggleHeight class="text-sm text-gray-600 dark:text-gray-400">{attack.desc}</p>{/if}
          </li>
          {/each}
          {/if}
          {#if npc.notes.length > 0}
            {#each npc.notes as note}
              <li class="py-3">
                <p class="text-sm font-medium">{note}</p>
              </li>
            {/each}
          {/if}
          {#if npc.wants}
            <li class="py-3">
              <p class="text-sm font-medium"><strong class="text-purple-700 dark:text-purple-200">Wants:</strong> {npc.wants}</p>
            </li>
          {/if}
          {#if npc.found}
            <li class="py-3">
              <p class="text-sm font-medium"><strong class="text-purple-700 dark:text-purple-200">Often Found:</strong> {npc.found}</p>
            </li>
          {/if}
        </ul>

      </div>
      </Card>
    </div>
  </div>
  {/each}
  </div>
</details>
{:else}
<div>No Encounters</div>
{/each}
<div>
  <button type="button" on:click={addEncounter} class="relative inline-flex items-center rounded-full bg-purple-300 dark:bg-purple-700 p-1 font-medium shadow-sm hover:bg-purple-200 dark:hover:bg-purple-800 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-900"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" class="h-4 w-4"><path fill="currentColor" d="M256 80c0-17.7-14.3-32-32-32s-32 14.3-32 32V224H48c-17.7 0-32 14.3-32 32s14.3 32 32 32H192V432c0 17.7 14.3 32 32 32s32-14.3 32-32V288H400c17.7 0 32-14.3 32-32s-14.3-32-32-32H256V80z"/></svg></button>
</div>

<div class="text-center my-6">
  <MenuLink href="/">Home</MenuLink>
</div>
</main>