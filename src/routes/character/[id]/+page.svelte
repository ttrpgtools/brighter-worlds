<script lang="ts">
  import DiceDialog from '$lib/DiceDialog.svelte';
  import { roll } from '$lib/rolling/roll';
  import Name from "$lib/sheet/Name.svelte";
  import type { DamageDetails, DieValue } from '$lib/types';
  import Attribute from '$lib/sheet/Attribute.svelte';
  import Equipment from '$lib/sheet/Equipment.svelte';
  import Grit from '$lib/sheet/Grit.svelte';
  import EulogyNotes from '$lib/sheet/EulogyNotes.svelte';
  import MenuLink from "$lib/MenuLink.svelte";
  import { manager } from '$lib/data/sheet-manager';
  import { onMount } from 'svelte';
  import { status } from '$lib/const';
  import Magic from '$lib/sheet/Magic.svelte';
  import { armor, burdened } from '$lib/util/character';
  import DamageDialog from './DamageDialog.svelte';
  import Calling from '$lib/sheet/Calling.svelte';
  import Statuses from '$lib/sheet/Statuses.svelte';
  import Roller from '$lib/sheet/Roller.svelte';
  import { broadcast } from '$lib/data/channel-child';

  export let data: {id: string;}

  let dice: DiceDialog;
  let damageDialog: DamageDialog;

  const character = manager.getSheet(data.id);

  onMount(() => {
    character.load();
    const unlisten = broadcast.addListener((msg) => console.log(`[Sheet] Broadcast received`, msg));
    return () => { unlisten(); }
  });
  
  function persist() {
    $character = $character;
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
    broadcast.send({id: $character.id, name: $character.name, type: 'roll', dice: sides, result: interim, label});
    label = label || `d${sides}`;
    dice.show(`${interim}`, sides, label);
    console.log(`${label} =`, interim);
  }
  
  function save(ev: CustomEvent<{ dice: DieValue[] }>, stat: string) {
    const dice = ev.detail.dice;
    const label = `${stat} Save`;
    showRoll(dice, label);
  }
  
  function damage(ev: CustomEvent<{ dice: DieValue[], name: string }>) {
    const dice = ev.detail.dice;
    const name = ev.detail.name;
    showRoll(dice, name);
  }

  async function takeDamage(ev: CustomEvent<{ type: 'str' | 'dex' | 'wil' }>) {
    const type = ev.detail.type;
    const chinfo: DamageDetails = {
      type,
      armor: armor($character.equipment),
      statuses: $character.statuses,
      grit: $character.grit.current,
      die: $character[type].current,
    };
    
    const results = await damageDialog.getDamage(chinfo);

    if (results == null) return;

    if (results.statuses != null) {
      $character.statuses = results.statuses;
    }
    if (results.grit != null) {
      $character.grit.current = results.grit;
    }
    if (results.die != null) {
      $character[type].current = results.die;
    }
    dice.show('Damage', results.dice, results.msg);
  }
  
  $: isDeprived = $character.statuses.has(status.DEPRIVED);
  $: isBurdened = burdened($character.equipment);
  </script>
  <svelte:head>
    <title>{$character.name || 'Character Sheet'} :: Brighter Worlds Online</title>
  </svelte:head>
  <DiceDialog bind:this={dice} />
  <DamageDialog bind:this={damageDialog} />
  <Roller on:roll={(ev) => showRoll([ev.detail])} />
  <div class="relative flex flex-col justify-start overflow-hidden dark:bg-gray-800 pt-6 pb-10 px-4 gap-4">
    <!-- <img src="/img/beams.jpg" alt="" class="absolute top-1/2 left-1/2 max-w-none -translate-x-1/2 -translate-y-1/2" width="1308" /> -->
    <div class="absolute inset-0 bg-[url(/img/grid.svg)] dark:invert bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]"></div>
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div class="relative justify-self-center text-center">
        <h1 class="text-4xl font-title">Brighter Worlds</h1>
        <span class="block font-symbol text-6xl h-4 relative -top-6 text-purple-500">j</span>
      </div>
      <Name bind:name={$character.name} bind:pronouns={$character.pronouns} />
      <div class="relative rounded-lg bg-white shadow-xl dark:bg-gray-900 dark:shadow-purple-400/20 ring-1 ring-gray-900/5  flex flex-col gap-6">
        <div class="px-4 py-5 sm:px-6 flex flex-col gap-4">
          <Grit bind:value={$character.grit} {isDeprived} {isBurdened} />
          <Attribute name="STR" value={$character.str} on:roll={(ev) => save(ev, 'STR')} on:damage={takeDamage} on:change={persist}/>
          <Attribute name="DEX" value={$character.dex} on:roll={(ev) => save(ev, 'DEX')} on:damage={takeDamage} on:change={persist}/>
          <Attribute name="WIL" value={$character.wil} on:roll={(ev) => save(ev, 'WIL')} on:damage={takeDamage} on:change={persist}/>
          <Statuses bind:statuses={$character.statuses} />
        </div>
      </div>
      
      <Equipment bind:equipment={$character.equipment} on:roll={damage} />
      <Calling calling={$character.calling} bind:abilities={$character.abilities} />
      <EulogyNotes bind:notes={$character.notes} bind:eulogy={$character.eulogy} />
      <Magic title="Spells" bind:magicList={$character.spells} on:roll={damage} type={'spell'} />
      <Magic title="Rituals" bind:magicList={$character.rituals} on:roll={damage} type={'ritual'} />
    </div>
  </div>
  <div class="text-center my-6">
    <MenuLink href="/character/">All Characters</MenuLink>
  </div>