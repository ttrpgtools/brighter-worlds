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
  import { getList, getSheetCache, loadSheet, tryMigrate } from '$lib/data/sheet-manager';
  import { onMount } from 'svelte';
  import { status } from '$lib/const';
  import Magic from '$lib/sheet/Magic.svelte';
  import { armor, burdened } from '$lib/util/character';
  import DamageDialog from '$lib/sheet/DamageDialog.svelte';
  import Calling from '$lib/sheet/Calling.svelte';
  import Statuses from '$lib/sheet/Statuses.svelte';
  import Roller from '$lib/sheet/Roller.svelte';
  import { broadcast } from '$lib/data/channel-child';
  import type { PageData } from './$types';
  import IconButton from '$lib/IconButton.svelte';
  import SheetSettings from '$lib/sheet/SheetSettings.svelte';
  import { sendToDiscord } from '$lib/util/discord';
  import Icon from '$lib/Icon.svelte';

  export let data: PageData;

  let dice: DiceDialog;
  let damageDialog: DamageDialog;
  let settingsDialog: SheetSettings;

  const list = getList();
  const cache = getSheetCache();
  const character = loadSheet(data.id, list);
  tryMigrate(cache);

  onMount(async () => {
    const unlisten = broadcast.subscribe((msg) => console.log(`[Sheet] Broadcast received`, msg));
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
    label = label || `d${sides}`;
    if ($character.settings?.rollToBridge) {
      broadcast.set({id: $character.id, name: $character.name, type: 'roll', dice: sides, result: interim, label});
    }
    if ($character.settings?.rollToDiscord) {
      sendToDiscord($character.name, interim, label, $character.settings.discordWebhook);
    }
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

  function openSettings() {
    settingsDialog.open();
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
  <SheetSettings bind:this={settingsDialog} bind:settings={$character.settings} />
  <Roller on:roll={(ev) => showRoll([ev.detail])} />
  <div class="relative flex flex-col justify-start overflow-hidden dark:bg-gray-800 pt-6 pb-10 px-4 gap-4">
    <!-- <img src="/img/beams.jpg" alt="" class="absolute top-1/2 left-1/2 max-w-none -translate-x-1/2 -translate-y-1/2" width="1308" /> -->
    <div class="absolute inset-0 bg-[url(/img/grid.svg)] dark:invert bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]"></div>
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div class="flex gap-2">
        <div><IconButton icon="cog" on:click={openSettings}/></div>
        <div class="relative justify-self-center text-center flex-grow">
          <h1 class="text-4xl font-title">Brighter Worlds</h1>
          <span class="block font-symbol text-6xl h-4 relative -top-6 text-purple-500">j</span>
        </div>
        <div class="w-8 flex flex-col gap-2">
          {#if $character.settings?.rollToDiscord}
          <Icon icon="discord" />
          {/if}
          {#if $character.settings?.rollToBridge}
          <Icon icon="broadcast" />
          {/if}
        </div>
      </div>
      <Name bind:name={$character.name} bind:pronouns={$character.pronouns} />
      <div class="relative rounded-lg bg-white shadow-xl dark:bg-gray-900 dark:shadow-purple-400/20 ring-1 ring-gray-900/5 md:h-[25rem] flex flex-col gap-6">
        <div class="px-4 py-5 sm:px-6 flex flex-col gap-4 h-full">
          <Grit bind:value={$character.grit} {isDeprived} {isBurdened} />
          <Attribute name="STR" value={$character.str} on:roll={(ev) => save(ev, 'STR')} on:damage={takeDamage} on:change={persist}/>
          <Attribute name="DEX" value={$character.dex} on:roll={(ev) => save(ev, 'DEX')} on:damage={takeDamage} on:change={persist}/>
          <Attribute name="WIL" value={$character.wil} on:roll={(ev) => save(ev, 'WIL')} on:damage={takeDamage} on:change={persist}/>
          <Statuses bind:statuses={$character.statuses} />
        </div>
      </div>
      
      <Equipment bind:equipment={$character.equipment} on:roll={damage} class="md:h-[25rem]" />
      <Calling calling={$character.calling} bind:abilities={$character.abilities} callingList={data.callings} enhancements={data.enhancements} />
      <EulogyNotes bind:notes={$character.notes} bind:eulogy={$character.eulogy} />
      <Magic title="Spells" bind:magicList={$character.spells} on:roll={damage} type={'spell'} />
      <Magic title="Rituals" bind:magicList={$character.rituals} on:roll={damage} type={'ritual'} />
    </div>
  </div>
  <div class="text-center my-6 flex flex-col items-center">
    <MenuLink href="/character/" icon="nav-characters">All Characters</MenuLink>
  </div>