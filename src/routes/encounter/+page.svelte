<script lang="ts">
  import DiceDialog from '$lib/DiceDialog.svelte';
  import { roll } from '$lib/rolling/roll';
  import type { DamageDetails, DieValue } from '$lib/types';
  import Attribute from '$lib/sheet/Attribute.svelte';
  import Grit from '$lib/sheet/Grit.svelte';
  import MenuLink from "$lib/MenuLink.svelte";
  import { encounters, getNpcInstance } from '$lib/data/encounter-manager';
  import { onMount } from 'svelte';
  import DamageDialog from '$lib/sheet/DamageDialog.svelte';
  import Roller from '$lib/sheet/Roller.svelte';
  import type { PageData } from './$types';
  import AutoTextarea from '$lib/AutoTextarea.svelte';
  import NpcDialog from './NpcDialog.svelte';
  import { append } from '$lib/util/array';
  import Card from '$lib/Card.svelte';
  import DeleteButton from '$lib/DeleteButton.svelte';
  import Button from '$lib/Button.svelte';
  import Equipment from '$lib/sheet/Equipment.svelte';
  import Icon from '$lib/Icon.svelte';
  import { getEncounterStates } from '$lib/data/ui-state';

  const encounterStates = getEncounterStates();
  export let data: PageData;

  let dice: DiceDialog;
  let damageDialog: DamageDialog;
  let npcDialog: NpcDialog;

  const list = encounters.list;

  let loading = true;

  onMount(async () => {
    loading = false;
  });

  function handleToggle(ev: Event, id: string) {
    $encounterStates[id] = (ev.target as HTMLDetailsElement).open;
  }
  
  function persist() {
    $list = $list;
  }
  
  function showRoll(sides: DieValue[], label: string = '') {
    const best = sides.reduce((p, c) => Math.max(roll(c), p), 0);
    
    label = label || sides.map(s => `d${s}`).join(',');
    dice.show(`${best}`, sides, label);
    console.log(`${label} =`, best);
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

  function removeEncounter(eid: string) {
    $list = $list.filter(x => x.id !== eid);
    const {[eid]: estate, ...rest} = $encounterStates;
    $encounterStates = rest;
  }

  function removeNpc(nid: string, eid: number) {
    $list[eid].npcs = $list[eid].npcs.filter(x => x.id !== nid);
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
<div class="flex flex-col gap-8 w-full max-w-4xl">
{#each $list as encounter, eindex}
<details class="w-full max-w-4xl" open={$encounterStates[encounter.id] ?? false} on:toggle={(ev) => handleToggle(ev, encounter.id)}>
  <summary class="marker:content-none cursor-pointer rounded-full w-full relative border-2 border-purple-300 dark:border-purple-600 py-2 px-6 mb-2 hover:bg-purple-100 dark:hover:bg-purple-900">
    <div class="inline-block text-3xl font-subtitle min-w-[2rem]">{encounter.name || `(unnamed)`}</div>
    <div class="absolute inset-y-0 right-1.5 flex items-center">
      <DeleteButton on:confirm={() => removeEncounter(encounter.id)} />
    </div>
  </summary>
  <div class="flex flex-col gap-4">
    <input type="text" placeholder="Name" bind:value={encounter.name} class="rounded-full dark:bg-gray-900 dark:text-white focus:ring-purple-500 focus:border-purple-500">
    <div class="mx-2"><AutoTextarea bind:value={encounter.notes} maxRows={12} minRows={3}></AutoTextarea></div>
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
    <div class="relative">
      <input type="text" class="w-full border-0 dark:bg-gray-900 placeholder-shown:bg-gray-100 dark:placeholder-shown:bg-black focus:border-purple-600 focus:ring-0 font-title text-3xl p-4 rounded-lg h-full" placeholder="Name" bind:value={npc.name}>
      <div class="absolute inset-y-0 right-4 flex items-center">
        <DeleteButton on:confirm={() => removeNpc(npc.id, eindex)} />
      </div>
    </div>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Card>
        <div class="flex flex-col gap-4">
          <Grit bind:value={npc.grit} isDeprived={false} isBurdened={false} />
          <Attribute name="STR" value={npc.str} on:roll={(ev) => save(ev, 'STR')} on:damage={(ev) => takeDamage(ev, eindex, nin)} on:change={persist}/>
          <Attribute name="DEX" value={npc.dex} on:roll={(ev) => save(ev, 'DEX')} on:damage={(ev) => takeDamage(ev, eindex, nin)} on:change={persist}/>
          <Attribute name="WIL" value={npc.wil} on:roll={(ev) => save(ev, 'WIL')} on:damage={(ev) => takeDamage(ev, eindex, nin)} on:change={persist}/>
          {#if npc.status}
          <div class="flex items-center gap-2 border w-fit py-2 px-3 rounded-md border-gray-300 bg-white dark:bg-gray-900 dark:hover:bg-gray-800 dark:border-gray-600 shadow-sm">
            <span>{npc.status}</span>
            <button type="button" title="Clear status" aria-label="Clear status" on:click={() => npc.status = ''} class="rounded-md bg-purple-900 p-0.5 text-white shadow-sm hover:bg-purple-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-600">
              <svg class="h-5 w-5 rotate-45" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
              </svg>
            </button>
          </div>
          {/if}
        </div>
      </Card>
      <div class="flex flex-col gap-4">
        {#if hasAttacks}
        <Equipment bind:equipment={$list[eindex].npcs[nin].attacks} title="Attacks" baseArmor={npc.armor} class="flex-1" on:roll={rollAttack} />
        {/if}
        {#if npc.wants || npc.found || npc.notes?.length > 0}
        <Card>
        <div>
          <ul class="-my-5 divide-y divide-gray-200 dark:divide-gray-600">
            <!-- {#each npc.attacks as attack (attack.id)}
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
            {/each} -->
            {#if npc.notes?.length > 0}
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
        {/if}
      </div>
    </div>
  </div>
  {/each}
  </div>
</details>
{:else}
<div class="flex items-center justify-center gap-3 text-gray-500 dark:text-gray-400">
  <Icon icon="nav-encounter" />
  {#if loading}Loading...{:else}No Encounters{/if}
</div>
{/each}
<div class="text-center">
  <Button on:click={addEncounter} icon="add-encounter">Add Encounter</Button>
</div>
<details class="max-w-prose mx-auto w-full">
  <summary class="font-bold marker:mr-4">Rules of Combat</summary>
  <div id="rules-of-combat" class="prose dark:prose-invert prose-h1:font-subtitle">
    <h1 id="combat">
      Combat
    </h1>
    <h2 id="rounds-and-initiative">
      Rounds and Initiative
    </h2>
    <p>
      When engaging in combat time is tracked in increments called Rounds.
      A Round lasts about 10 seconds, or enough time for someone to run
      across a room and perform one significant action.
    </p>
    <p>
      During a Round, each side of a conflict acts together. Each
      individual on a side can act in whatever order they choose, and can
      move about 40 feet, and perform one significant action (make an
      attack, use an item, cast a spell, etc.).
    </p>
    <p>
      Any actions that carry risk require a Save as usual, usually against
      the creature you’re engaged with.
    </p>
    <p>
      If it’s not clear which side should act first, make a DEX Save vs
      the opposition to act before them.
    </p>
    <h2 id="attacking">
      Attacking
    </h2>
    <p>
      To make an attack, roll your weapon’s damage die. The target of the
      attack subtracts their armor and reduces their Grit by the
      remainder. If there is no excess damage, the target was able to
      avoid or otherwise defend against the attack. If there is more
      damage dealt than the remaining Grit, the excess damage becomes
      Direct Damage.
    </p>
    <p>
      Direct Damage represents the attack making physical contact with the
      target, and causes a STR Save to avoid Critical Damage.
    </p>
    <h2 id="critical-damage-save">
      Critical Damage Save
    </h2>
    <p>
      After receiving Direct Damage, make a STR Save and roll higher than
      that amount to avoid Critical Damage.
    </p>
    <p>
      If you suffer multiple attacks simultaneously, make your Save
      against their combined Direct Damage, rather than making separate
      Saves. Armor still applies to each attack individually.
    </p>
    <h2 id="critical-damage">
      Critical Damage
    </h2>
    <p>
      If you suffer Critical Damage, step down your STR and suffer any
      Critical Damage effects from your attackers.
    </p>
    <p>
      If your STR steps down below a d4 (zero STR) you become
      <em>incapacitated</em>. An <em>incapacitated</em> creature can only
      weakly crawl, and will die in an hour without assistance. First aid
      from an ally gets you back on your feet, but doesn’t restore your
      STR.
    </p>
    <p>
      Taking Direct Damage, or trying to step down your die at zero STR is
      lethal.
    </p>
    <h2 id="overflow-damage">
      Overflow Damage
    </h2>
    <p>
      If the amount of Direct Damage you received is equal to or greater
      than the highest value on your STR die, immediately suffer Critical
      Damage. If the damage in excess of that amount is still equal to or
      greater than your now lowered STR die, repeat. If it is lower, make
      a Critical Damage Save as usual trying to roll higher the remaining
      damage.
    </p>
    <p>
      If your STR steps below a d4 during this process, you become
      incapacitated and ignore any remaining damage.
    </p>
    <h2 id="attack-modifiers">
      Attack Modifiers
    </h2>
    <p>
      If you make an attack that is at an advantage (against an
      unsuspecting target, from higher ground, etc.) it is
      <em>enhanced</em>. Roll a d12 in addition to your other dice, and
      keep only the highest result.
    </p>
    <p>
      If you attack while disadvantaged (through cover, while blind,
      unarmed, etc.) it is <em>impaired</em>. Roll a d4 instead of your
      other dice.
    </p>
    <h2 id="blast">
      Blast
    </h2>
    <p>
      Attacks with the <em>blast</em> quality affect all targets in the
      area. This can refer to actual explosions, fireballs, whirling
      blades, or to a giant swinging a club in a wide arc.
    </p>
    <h2 id="morale-saves">Morale Saves</h2>
    <p>
      When an NPC faces daunting, terrifying, or dangerous situations they
      should make a WIL Save to avoid surrender or flight.
    </p>
    <p>
      NPCs make Morale Saves the first time they take Critical Damage, the
      first time one of their companions is incapacitated or killed, or if
      the tide of battle turns against them.
    </p>
    <p>
      Morale Saves are also made when an NPC is presented with a situation
      dramatically outside their understanding, or hirelings being asked
      to put themselves at significant risk.
    </p>
    <p>
      A Morale Save might be <em>enhanced</em> due to a courageous leader,
      the promise of significant reward, or being particularly oblivious.
      It might be <em>impaired</em> due to being directly threatened, a
      hopeless situation, or the obvious evidence of immediate danger.
    </p>
  </div>
</details>
</div>

<div class="text-center my-6">
  <MenuLink href="/" icon="logo-leaf">Home</MenuLink>
</div>
</main>