<script lang="ts">
  import Modal from '$lib/Modal.svelte';
  import { roll } from '$lib/rolling/roll';
  import Name from "$lib/sheet/Name.svelte";
  import Card from "$lib/Card.svelte";
  import type { Character, DieValue } from '$lib/types';
  import Attribute from '$lib/sheet/Attribute.svelte';
  import Equipment from '$lib/sheet/Equipment.svelte';
  import { renderUnsafe } from '$lib/md/render';
  import Grit from '$lib/sheet/Grit.svelte';
  import { stepDown } from '$lib/dice';
  import EulogyNotes from '$lib/sheet/EulogyNotes.svelte';
  import MenuLink from "$lib/MenuLink.svelte";
  import { manager } from '$lib/data/sheet-manager';
  import { onMount } from 'svelte';
  const DEPRIVED = 'deprived';
  const PARALYSED = 'paralysed';
  const CATATONIC = 'catatonic';
  const DEAD = 'dead';
  const INCAPACITATED = 'incapacitated';

  export let data: {id: string;}
  
  let dieRoll = 0;
  let dieLabel = '';
  let dice: DieValue[] = [];
  const character = manager.getSheet(data.id);

  onMount(() => {
    character.load();
  });
  
  function persist() {
    $character = $character;
  }

  const testcharacter: Character = {
    id: '',
    name: 'Choppy Pete',
    pronouns: 'he/them',
    grit: { current: 3, max: 3 },
    str: { current: 8, max: 8 },
    dex: { current: 4, max: 4 },
    wil: { current: 6, max: 6 },
    statuses: new Set<string>([]),
    equipment: [
      { name: 'Colorful Rapier', desc: 'Bright pink slender sword.', damage: 6, bulky: false },
      { name: 'Decorated Armor', desc: 'Plates so nice you could eat off them.', bulky: true, armor: 1 },
      { name: 'Old fashioned Cloak', desc: 'Always a classic.', bulky: false },
      { name: 'Flexible 10-foot pole', desc: 'Why is it so droopy?', bulky: false },
    ],
    calling: { name: 'Devoted' },
    abilities: [
      {
        name: 'Devoted Oath',
        type: 'core',
        desc: `Choose a vow you must live by, and two boons your devotion grants you. If you break your vow, you lose your boons for a year and a day, or until you make amends.`,
        details: '**Devotion:** My fair goddess of the light.\n\n**Vow:** Poverty\n\n**Boons:** Can\'t Stop Won\'t Stop, Weapon of Faith (Paired)'
      },
    ],
    eulogy: [
      {message: 'I remember the time he killed that whole flock of seagulls when one bit his friend.', xp: 1, spent: 0},
    ],
    spells: [],
    rituals: [],
    notes: 'Hello note.',
  };
  
  const ENDGAME = {
    str: { msg: 'You died.', status: DEAD },
    dex: { msg: 'You are paralysed.', status: PARALYSED },
    wil: { msg: 'You are catatonic.', status: CATATONIC },
  };
  
  function capitalize(word: string) {
    return word[0].toUpperCase() + word.substring(1);
  }
  
  function showRoll(sides: DieValue[], label: string = '') {
    dice = sides;
    const [first, second] = sides;
    let interim = roll(first);
    if (second) {
      const secondValue = roll(second);
      console.log('first', interim, 'second', secondValue);
      if (secondValue > interim) {
        interim = secondValue;
      }
    }
    dieRoll = interim;
    label = label || `d${sides}`;
    dieLabel = `${label} = ${dieRoll}`;
    console.log(`${label} =`, dieRoll);
  }
  
  function save(ev: CustomEvent<{ dice: DieValue[] }>, stat: string) {
    const dice = ev.detail.dice;
    const label = `${stat} Save`;
    showRoll(dice, label);
  }
  
  function damage(ev: CustomEvent<{ dice: DieValue[], name: string }>) {
    const dice = ev.detail.dice;
    const name = ev.detail.name;
    const label = `Damage from ${name}`;
    showRoll(dice, label);
  }
  
  function rest() {
    if (!$character.statuses.has(DEPRIVED)) {
      $character.grit.current = $character.grit.max;
    }
  }
  
  function addGear() {
    dieLabel = 'Not implemented (yet)';
    dice = [];
    dieRoll = 1;
  }
  
  function takeDamage(ev: CustomEvent<{ type: 'str' | 'dex' | 'wil' }>) {
    const type = ev.detail.type;
    const howmuch = prompt('How much potential damage?');
    if (howmuch == null || howmuch === '') return;
    const amount = parseInt(howmuch, 10);
    if (Number.isNaN(amount)) return;
    const totalArmor = $character.equipment.reduce((p, c) => p + (!!c.armor ? c.armor : 0), 0);
    let unmitigated = amount - totalArmor;
    if (unmitigated <= 0) {
      dieLabel = 'Your armor protected you from the damage.';
      dieRoll = 1;
      dice = [];
      return;
    }
    if ($character.grit.current > 0) {
      const gritUsed = Math.min($character.grit.current, unmitigated);
      $character.grit.current -= gritUsed;
      unmitigated -= gritUsed;
    }
    if (unmitigated <= 0) {
      dieLabel = 'You managed to avoid damage through your grit.';
      dieRoll = 1;
      dice = [];
      return;
    }
    const currentAttr = $character[type].current;
    if (currentAttr === 0) {
      dieLabel = ENDGAME[type].msg;
      $character.statuses.delete(INCAPACITATED);
      $character.statuses.add(ENDGAME[type].status);
      $character.statuses = $character.statuses;
      dieRoll = 1;
      dice = [];
      return;
    }
    const saveAgainstDirectDamage = roll(currentAttr);
    const critical = unmitigated >= saveAgainstDirectDamage;
    if (critical) {
      const newAttr = stepDown(currentAttr);
      let ps = '';
      if (newAttr === 0) {
        ps = 'You are now incapacitated.';
        $character.statuses.add(INCAPACITATED);
        $character.statuses = $character.statuses;
      } else {
        ps = `Your d${currentAttr} is now a d${newAttr}.`;
      }
      dieLabel = `You took ${unmitigated} direct damage, rolled a ${saveAgainstDirectDamage} and have taken critical damage. ${ps}`;
      dieRoll = 1;
      dice = [currentAttr];
      $character[type].current = newAttr;
    } else {
      dieLabel = `You took ${unmitigated} direct damage but rolled a ${saveAgainstDirectDamage} and avoided critical damage.`;
      dieRoll = 1;
      dice = [currentAttr];
    }
  }
  
  function closeModal() {
    dieRoll = 0;
  }
  
  function toggleStatus(status: string) {
    if ($character.statuses.has(status)) {
      $character.statuses.delete(status);
    } else {
      $character.statuses.add(status);
    }
    $character.statuses = $character.statuses;
  }
  
  $: isDeprived = $character.statuses.has(DEPRIVED);
  </script>
  <svelte:head>
    <title>{$character.name || 'Character Sheet'} :: Brighter Worlds Online</title>
  </svelte:head>
  <Modal on:close={closeModal} show={dieRoll > 0} label={dieLabel} {dice}/>
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
          <Grit value={$character.grit} on:rest={rest} on:input={persist}/>
          <Attribute name="STR" value={$character.str} on:roll={(ev) => save(ev, 'STR')} on:damage={takeDamage} on:change={persist}/>
          <Attribute name="DEX" value={$character.dex} on:roll={(ev) => save(ev, 'DEX')} on:damage={takeDamage} on:change={persist}/>
          <Attribute name="WIL" value={$character.wil} on:roll={(ev) => save(ev, 'WIL')} on:damage={takeDamage} on:change={persist}/>
          
          <div>
            <div class="flex items-center gap-2">
              <button type="button" on:click={() => toggleStatus(DEPRIVED)} class="inline-flex items-center rounded border border-gray-300 bg-white dark:bg-gray-900 dark:border-gray-600 px-2.5 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2" class:bg-purple-200={isDeprived} class:border-purple-800={isDeprived} class:dark:bg-purple-800={isDeprived} class:dark:border-purple-200={isDeprived}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" class="-ml-0.5 mr-2 h-4 w-4 text-gray-400 dark:text-gray-500" class:!text-purple-800={isDeprived} class:dark:!text-purple-100={isDeprived}><path fill="currentColor" d="M35.2 126.3c4.1 1.1 8.4 1.7 12.8 1.7c26.5 0 48-21 48-47c0-5-1.8-11.3-4.6-18.1c-.3-.7-.6-1.4-.9-2.1c-8.9-20.2-26.5-44.9-36-57.5c-3.2-4.4-9.6-4.4-12.8 0C28.6 20.6 0 61 0 81c0 21.7 14.9 39.8 35.2 45.3zM256 0c-51.4 0-99.3 15.2-139.4 41.2c1.5 3.1 3 6.2 4.3 9.3c3.4 8 7.1 19 7.1 30.5c0 44.3-36.6 79-80 79c-9.6 0-18.8-1.7-27.4-4.8C7.3 186.2 0 220.2 0 256C0 397.4 114.6 512 256 512s256-114.6 256-256S397.4 0 256 0zM195.9 410.7c-5.9 6.6-16 7.1-22.6 1.2s-7.1-16-1.2-22.6C188.2 371.4 216.3 352 256 352s67.8 19.4 83.9 37.3c5.9 6.6 5.4 16.7-1.2 22.6s-16.7 5.4-22.6-1.2c-11.7-13-31.6-26.7-60.1-26.7s-48.4 13.7-60.1 26.7zM96 272c0-8.8 7.2-16 16-16h96c8.8 0 16 7.2 16 16s-7.2 16-16 16H112c-8.8 0-16-7.2-16-16zm208-16h96c8.8 0 16 7.2 16 16s-7.2 16-16 16H304c-8.8 0-16-7.2-16-16s7.2-16 16-16z"/></svg>
                Deprived
              </button>
              {#each Array.from($character.statuses.values()) as status}
                {#if status !== DEPRIVED}
                <button type="button" on:click={() => toggleStatus(status)} class="inline-flex items-center rounded border border-purple-800 bg-purple-200 dark:bg-purple-800 dark:border-purple-200 px-2.5 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2">
                  {capitalize(status)}
                </button>
                {/if}
              {/each}
            </div>
          </div>
        </div>
      </div>
      
      <Equipment equipment={$character.equipment} on:roll={damage} on:add={addGear} />
  
      <Card>
        <div class="flex items-center gap-2" slot="header">
          <h3 class="text-xl font-subtitle leading-6 flex-1">{$character.calling.name}</h3>
          <p class="text-gray-500 relative -top-1">(Calling)</p>
        </div>
        {#if $character.calling.desc}
        <div>
          {$character.calling.desc}
        </div>
        {/if}
        <ul>
          {#each $character.abilities as ability}
          <li><span><strong>{ability.name}</strong> {ability.desc}</span><div>{@html renderUnsafe(ability.details ?? '')}</div></li>
          {/each}
        </ul>
      </Card>
      <EulogyNotes notes={$character.notes} eulogy={$character.eulogy} />
      <Card title="Spells">
        <div class="h-full">
          <div id="spells" class="block min-h-[4rem] w-full dark:bg-gray-900 border-0 sm:text-sm"></div>
        </div>
      </Card>
      <Card title="Rituals">
        <div class="h-full">
          <div id="rituals" class="block min-h-[4rem] w-full dark:bg-gray-900 border-0 sm:text-sm"></div>
        </div>
      </Card>
    </div>
  </div>
  <div class="text-center my-6">
    <MenuLink href="/character/">All Characters</MenuLink>
  </div>