<script lang="ts">
  import DiceDialog from '$lib/DiceDialog.svelte';
  import { roll } from '$lib/rolling/roll';
  import type { DamageDetails, DieValue } from '$lib/types';
  import MenuLink from "$lib/MenuLink.svelte";
  import { encounters, getEncountersSettings, getNpcInstance } from '$lib/data/encounter-manager';
  import { onMount } from 'svelte';
  import DamageDialog from '$lib/sheet/DamageDialog.svelte';
  import Roller from '$lib/sheet/Roller.svelte';
  import type { PageData } from './$types';
  import AutoTextarea from '$lib/AutoTextarea.svelte';
  import NpcDialog from './NpcDialog.svelte';
  import { append } from '$lib/util/array';
  import DeleteButton from '$lib/DeleteButton.svelte';
  import Button from '$lib/Button.svelte';
  import Icon from '$lib/Icon.svelte';
  import { getEncounterStates } from '$lib/data/ui-state';
  import SheetSettings from '$lib/sheet/SheetSettings.svelte';
  import IconButton from '$lib/IconButton.svelte';
  import { sendToDiscord } from '$lib/util/discord';
  import NpcSheet from './NpcSheet.svelte';
  import { armor } from '$lib/util/character';
  import HomeLink from '$lib/HomeLink.svelte';

  const encountersSettings = getEncountersSettings();
  const encounterStates = getEncounterStates();
  export let data: PageData;

  let dice: DiceDialog;
  let damageDialog: DamageDialog;
  let npcDialog: NpcDialog;
  let settingsDialog: SheetSettings;

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
  
  function showRoll(sides: DieValue[], label: string = '', name = 'NPC') {
    const best = sides.reduce((p, c) => Math.max(roll(c), p), 0);
    
    label = label || sides.map(s => `d${s}`).join(',');
    // if ($encountersSettings?.rollToBridge) {
    //   broadcast.set({id: $character.id, name: $character.name, type: 'roll', dice: sides, result: best, label});
    // }
    if ($encountersSettings?.rollToDiscord) {
      sendToDiscord(name, best, label, $encountersSettings.discordWebhook, sides);
    }

    dice.show(`${best}`, sides, label);
    console.log(`${label} =`, best);
  }
  
  function basicRoll(ev: CustomEvent<{ dice: DieValue[], name: string }>, npcname = 'NPC') {
    const { dice, name } = ev.detail;
    showRoll(dice, name, npcname);
  }

  async function takeDamage(ev: CustomEvent<{ type: 'str' | 'dex' | 'wil' }>, eindex: number, nindex: number) {
    const type = ev.detail.type;
    const npc = $list[eindex].npcs[nindex];
    const chinfo: DamageDetails = {
      type,
      armor: armor(npc.attacks) + (npc.armor || 0),
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
    if ($encountersSettings?.rollToDiscord && results.save) {
      sendToDiscord(npc.name, results.save, `${type.toUpperCase()} save against ${results.dd ?? '?'} direct damage.`, $encountersSettings.discordWebhook, results.dice);
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
<HomeLink />
<NpcDialog npcList={data.npcs} bind:this={npcDialog} />
<DiceDialog bind:this={dice} />
<DamageDialog bind:this={damageDialog} />
<SheetSettings bind:this={settingsDialog} bind:settings={$encountersSettings} />
<Roller on:roll={(ev) => showRoll([ev.detail])} />
<main class="p-4 sm:p-8 flex flex-col items-center gap-2">
  <div class="flex flex-row gap-3 items-center">
    <h2 class="font-title text-4xl text-center">Encounters</h2>
    <IconButton icon="cog" on:click={() => settingsDialog.open()}/>
    {#if $encountersSettings?.rollToDiscord}
    <Icon icon="discord" />
    {/if}
  </div>
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
  <NpcSheet bind:npc
    on:confirm={() => removeNpc(npc.id, eindex)}
    on:roll={ev => basicRoll(ev, npc.name)}
    on:damage={(ev) => takeDamage(ev, eindex, nin)}
    on:change={persist} />
  
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
  <MenuLink href="/gm" icon="nav-gm">GM Tools</MenuLink>
</div>
</main>