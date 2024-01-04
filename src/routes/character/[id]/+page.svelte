<script lang="ts">
  import DiceDialog from '$lib/DiceDialog.svelte';
  import { bestRoll } from '$lib/rolling/roll';
  import Name from "$lib/sheet/Name.svelte";
  import type { Attr, DamageDetails, DieMod, DieValue, Item, Magic as MagicType } from '$lib/types';
  import Attribute from '$lib/sheet/Attribute.svelte';
  import Equipment from '$lib/sheet/Equipment.svelte';
  import Grit from '$lib/sheet/Grit.svelte';
  import EulogyNotes from '$lib/sheet/EulogyNotes.svelte';
  import MenuLink from "$lib/MenuLink.svelte";
  import { getList, getSheetCache, loadSheet, tryMigrate } from '$lib/data/sheet-manager';
  import { onMount } from 'svelte';
  import { SAVE_GOAL, status } from '$lib/const';
  import Magic from '$lib/sheet/Magic.svelte';
  import { armor, burdened, isFunctional } from '$lib/util/character';
  import DamageDialog from '$lib/sheet/DamageDialog.svelte';
  import Calling from '$lib/sheet/Calling.svelte';
  import Statuses from '$lib/sheet/Statuses.svelte';
  import Roller from '$lib/sheet/Roller.svelte';
  import { broadcast, broadcastItem, broadcastMagic, broadcastRoll, broadcastScene } from '$lib/data/channel-child';
  import type { PageData } from './$types';
  import IconButton from '$lib/IconButton.svelte';
  import SheetSettings from '$lib/sheet/SheetSettings.svelte';
  import { sendToDiscord } from '$lib/util/discord';
  import Icon from '$lib/Icon.svelte';
  import Loader from '$lib/Loader.svelte';
  import { writable } from 'svelte/store';
  import { calculateGrit } from '$lib/util/grit';
  import { registerForRollCall } from '$lib/data/broadcast-hub';
  import { stepDown } from '$lib/dice';
  import ChoiceDialog from '$lib/ChoiceDialog.svelte';

  let loadStatus = writable('Loading...');

  export let data: PageData;

  const FAILED_CAST_UNC = 1;
  const FAILED_CAST_FAIL = 2;
  const failedCast = [
    {value: FAILED_CAST_FAIL, label: `Spell Fails`},
    {value: FAILED_CAST_UNC, label: `Fall Unconscious`},
  ];
  let failedRoll = 0;

  let dice: DiceDialog;
  let damageDialog: DamageDialog;
  let settingsDialog: SheetSettings;
  let castDialog: ChoiceDialog<number>;

  const list = getList();
  const cache = getSheetCache();
  const character = loadSheet(data.id, list, cache);
  tryMigrate(loadStatus, cache).then(() => loadStatus.set(''));

  onMount(() => {
    const unsubs: (() => void)[] = [];
    unsubs.push(broadcast.subscribe((msg) => console.log(`[Sheet] Broadcast received`, msg)));
    unsubs.push(registerForRollCall(here => $character.name ? here($character.id, $character.name) : setTimeout(() => here($character.id, $character.name), 200)));
    return () => { unsubs.forEach(x => x()) }
  });
  
  function persist() {
    const newGrit = calculateGrit($character.dex.max, $character.wil.max);
    $character.grit.max = newGrit;
    $character = $character;
  }

  function sendRollExternal(value: number, label: string, sides: DieValue[]) {
    if ($character.settings?.rollToBridge !== false) {
      broadcastRoll($character.name, value, label, sides, $character.name);
      //broadcast.set({id: $character.id, name: $character.name, type: 'roll', dice: sides, result: best, label});
    }
    if ($character.settings?.rollToDiscord) {
      sendToDiscord($character.name, value, label, $character.settings.discordWebhook, sides, $character.name);
    }
  }
  
  async function showRoll(sides: DieValue[], label: string = '', rollValue?: number, titleClass = '') {
    if (rollValue == null && sides.length === 0) return;
    const best = rollValue ?? bestRoll(sides);
    label = label || `d${sides}`;
    sendRollExternal(best, label, sides);
    await dice.show(`${best}`, sides, label, titleClass);
    console.log(`${label} =`, best);
    return best;
  }
  
  function save(ev: CustomEvent<{ dice: DieValue[] }>, stat: string) {
    const dice = ev.detail.dice;
    const label = `${stat} Save`;
    const value = bestRoll(dice);
    showRoll(dice, label, value, value >= SAVE_GOAL ? 'text-emerald-500' : 'text-rose-500');
  }
  
  function damage(ev: CustomEvent<{ dice: DieValue[], name: string }>) {
    const {dice, name} = ev.detail;
    showRoll(dice, name);
  }

  function shareItem(ev: CustomEvent<Item>) {
    broadcastItem(ev.detail, $character.name);
  }

  function shareMagic(ev: CustomEvent<MagicType>) {
    broadcastMagic(ev.detail, $character.name);
  }

  async function cast(ev: CustomEvent<{ dice: DieValue[], name: string }>) {
    if (!isFunctional($character.statuses) || $character.wil.current === 0) {
      await dice.show('Non Functional', [], `Your status indicates you may not be 'casting capable' at the moment`);
      return;
    }
    const name = ev.detail.name;
    const rolledDice = ev.detail.dice;
    if ($character.grit.current > 0) {
      $character.grit.current = 0;
      if (rolledDice.length) {
        await showRoll(rolledDice, name);
      } else {
        await dice.show(`Cast`, [], name);
      }
    } else {
      const wilSave = bestRoll([$character.wil.current]);
      if (wilSave >= SAVE_GOAL) {
        await showRoll([$character.wil.current], 'WIL Save Success!', wilSave, 'text-emerald-500');
        if (rolledDice.length) {
          await showRoll(rolledDice, name);
        } else {
          await dice.show(`Cast`, [], name);
        }
      } else {
        const newWil = stepDown($character.wil.current);
        if (newWil === 0) {
          $character.statuses.add(status.CATATONIC);
          $character.statuses = $character.statuses;
          await showRoll([$character.wil.current], `WIL Save Failed. You've lost all will and have become catatonic`, wilSave, 'text-rose-500');
        } else {
          failedRoll = wilSave;
          sendRollExternal(wilSave, 'WIL Save Failed', [$character.wil.current]);
          const opt = await castDialog.open();
          if (opt === FAILED_CAST_UNC) {
            $character.statuses.add(status.UNCONSCIOUS);
            $character.statuses = $character.statuses;
            if (rolledDice.length) {
              await showRoll(rolledDice, name);
            } else {
              await dice.show(`Cast`, [], name);
            }
          }
        }
        $character.wil.current = newWil;
      }
    }
  }

  function openSettings() {
    settingsDialog.open();
  }

  async function takeDamage(ev: CustomEvent<{ type: Attr, mod?: DieMod }>) {
    const type = ev.detail.type;
    const mod = ev.detail.mod;
    const chinfo: DamageDetails = {
      type,
      mod,
      armor: armor($character.equipment),
      statuses: $character.statuses,
      grit: $character.grit.current,
      dice: {str: $character.str.current, dex: $character.dex.current, wil: $character.wil.current},
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
    if ($character.settings?.rollToDiscord && results.save) {
      sendToDiscord($character.name, results.save, `${type.toUpperCase()} save against ${results.dd ?? '?'} direct damage.`, $character.settings.discordWebhook, results.dice, $character.name);
    }
    if ($character.settings?.rollToBridge !== false && results.save) {
      broadcastRoll($character.name, results.save, `${type.toUpperCase()} save against ${results.dd ?? '?'} direct damage.`, results.dice, $character.name);
    }
    console.log(`Take Damage Result Dice`, results.dice);
    dice.show('Damage', results.dice, results.msg);
  }
  
  $: isDeprived = $character.statuses.has(status.DEPRIVED);
  $: isBurdened = burdened($character.equipment);
  $: {

  }
  $: isSharing = $character.settings?.rollToBridge !== false || $character.settings?.rollToDiscord;
  </script>
  <svelte:head>
    <title>{$character.name || 'Character Sheet'} :: Brighter Worlds Online</title>
  </svelte:head>
  <DiceDialog bind:this={dice} />
  <DamageDialog bind:this={damageDialog} />
  <ChoiceDialog bind:this={castDialog} choices={failedCast} msg="WIL Save Failed. You lose some WIL and have to choose..." titleClass="text-rose-500" title={failedRoll.toString()} />
  <SheetSettings bind:this={settingsDialog} bind:settings={$character.settings} />
  <Roller on:roll={(ev) => showRoll([ev.detail])} />
  {#if $loadStatus}
  <div class="fixed inset-0 flex items-center justify-center z-50 bg-purple-500/10">
    <div class="py-12 px-20 rounded-2xl bg-gray-600/40 flex items-center justify-center flex-col gap-8">
      <Loader size="w-16 h-16" />
      {$loadStatus}
    </div>
  </div>
  {/if}
  <div class="relative flex flex-col justify-start overflow-hidden dark:bg-gray-800 pt-6 pb-10 px-4 gap-4">
    <!-- <img src="/img/beams.jpg" alt="" class="absolute top-1/2 left-1/2 max-w-none -translate-x-1/2 -translate-y-1/2" width="1308" /> -->
    <div class="absolute inset-0 bg-[url(/img/grid.svg)] dark:invert bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]"></div>
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div class="flex gap-2 items-center md:items-start">
        <div><IconButton icon="cog" on:click={openSettings}/></div>
        <div class="relative justify-self-center text-center flex-grow">
          <h1 class="text-4xl font-title">Brighter Worlds</h1>
          <span class="md:block font-symbol text-6xl hidden h-4 relative -top-6 text-purple-500">j</span>
        </div>
        <div class="w-8 flex flex-col gap-2">
          {#if $character.settings?.rollToDiscord}
          <Icon icon="discord" />
          {/if}
          {#if $character.settings?.rollToBridge !== false}
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
      
      <Equipment bind:equipment={$character.equipment} on:roll={damage} class="md:h-[25rem]" {isSharing} on:share={shareItem} />
      <Magic title="Spells" bind:magicList={$character.spells} on:roll={cast} castable on:cast={cast} type={'spell'} {isSharing} on:share={shareMagic} />
      <Magic title="Rituals" bind:magicList={$character.rituals} on:roll={damage} type={'ritual'} {isSharing} on:share={shareMagic} />
      <Calling calling={$character.calling} bind:abilities={$character.abilities} callingList={data.callings} enhancements={data.enhancements} />
      <EulogyNotes bind:notes={$character.notes} bind:eulogy={$character.eulogy} />
    </div>
  </div>
  <div class="text-center my-6 flex flex-col items-center">
    <MenuLink href="/character/" icon="nav-characters">All Characters</MenuLink>
  </div>