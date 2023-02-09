<script lang="ts">
  import NotificationDialog from '$lib/NotificationDialog.svelte';
  import InputDialog from '$lib/InputDialog.svelte';
  import Toggle from '$lib/Toggle.svelte';
  import { roll } from '$lib/rolling/roll';
  import Name from "$lib/sheet/Name.svelte";
  import Card from "$lib/Card.svelte";
  import type { Magic as ArcaneItem, CharacterDetails, DamageForm, DieValue, Item, MagicType } from '$lib/types';
  import Attribute from '$lib/sheet/Attribute.svelte';
  import Equipment from '$lib/sheet/Equipment.svelte';
  import { renderUnsafe } from '$lib/md/render';
  import Grit from '$lib/sheet/Grit.svelte';
  import EulogyNotes from '$lib/sheet/EulogyNotes.svelte';
  import MenuLink from "$lib/MenuLink.svelte";
  import { manager } from '$lib/data/sheet-manager';
  import { onMount } from 'svelte';
  import { status } from '$lib/const';
  import { calculateDamage } from './damage';
  import DieSelector from '$lib/sheet/DieSelector.svelte';
  import { id } from '$lib/rolling/id';
  import Magic from '$lib/sheet/Magic.svelte';

  export let data: {id: string;}

  interface ItemForm {
    id?: string;
    name: string;
    desc: string;
    bulky: boolean;
    damage: DieValue | 0;
    blast: boolean;
    enableMagic: boolean;
    armor: string;
  }

  interface MagicForm {
    id?: string;
    type?: MagicType;
    name: string;
    desc: string;
    damage: DieValue | 0;
    blast: boolean;
  }
  
  let dieLabel = '';
  let dice: DieValue[] = [];
  let saveType = '';
  let notify: NotificationDialog;
  let damageDialog: InputDialog<DamageForm>;
  const damageForm: DamageForm = { damage: '', bypassGrit: false, bypassArmor: false, overflow: true };
  let itemDialog: InputDialog<ItemForm>;
  let itemDialogTitle = '';
  let itemDialogDelete = false;
  let itemForm: ItemForm = newItemForm();

  let magicDialog: InputDialog<MagicForm>;
  let magicDialogTitle = '';
  let magicDialogDelete = false;
  let magicForm: MagicForm = newMagicForm();

  const character = manager.getSheet(data.id);

  onMount(() => {
    character.load();
  });
  
  function persist() {
    $character = $character;
  }

  function newItemForm(id?: string) {
    if (id) {
      const item = $character.equipment.find(x => x.id === id);
      if (item != null) {
        return {
          ...item,
          damage: item.damage ?? 0,
          armor: item.armor ? item.armor.toString() : ''
        } as ItemForm;
      }
    }
    return {
      name: '',
      desc: '',
      damage: 0,
      blast: false,
      bulky: false,
      enableMagic: false,
      armor: '',
    } as ItemForm;
  }

  function newMagicForm(existing?: {id: string, type: MagicType}) {
    if (existing?.id) {
      const magic = existing.type === 'spell' ? $character.spells.find(x => x.id === existing.id) : $character.rituals.find(x => x.id === existing.id);
      if (magic != null) {
        return {
          ...magic,
          damage: magic.damage ?? 0,
        } as MagicForm;
      }
    }
    return {
      name: '',
      desc: '',
      damage: 0,
      blast: false,
    } as MagicForm;
  }
  
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
    const dieRoll = interim;
    label = label || `d${sides}`;
    dieLabel = `${label} = ${dieRoll}`;
    notify.open();
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
    if (!$character.statuses.has(status.DEPRIVED)) {
      $character.grit.current = $character.grit.max;
    }
  }

  async function gearForm() {
    const item = await itemDialog.open();
    if (item != null) {
      const proper: Item = {
        id: item.id || id(),
        name: item.name,
        desc: item.desc,
        bulky: item.bulky,
        blast: item.blast,
        enableMagic: item.enableMagic
      }
      if (item.damage !== 0) {
        proper.damage = item.damage;
      }
      if (item.armor) {
        proper.armor = parseInt(item.armor, 10);
      }
      return proper;
    }
  }
  
  async function addGear() {
    itemDialogTitle = 'Add item';
    itemDialogDelete = false;
    itemForm = newItemForm();
    const item = await gearForm();
    if (item != null) {
      $character.equipment = [...$character.equipment, item];
    }
  }

  async function editGear(ev: CustomEvent<string>) {
    const id = ev.detail;
    itemDialogTitle = 'Edit item';
    itemDialogDelete = true;
    itemForm = newItemForm(id);
    const item = await gearForm();
    if (item != null) {
      const index = $character.equipment.findIndex(x => x.id === id);
      if (index >= 0) {
        $character.equipment = [...$character.equipment.slice(0, index), item, ...$character.equipment.slice(index + 1)];
      }
    }
  }

  function removeGear(ev: CustomEvent<ItemForm>) {
    const id = ev.detail.id;
    if (id) {
      $character.equipment = $character.equipment.filter(e => e.id !== id);
    }
  }

  async function arcaneForm(type: MagicType) {
    const item = await magicDialog.open();
    if (item != null) {
      const proper: ArcaneItem = {
        id: item.id || id(),
        type,
        name: item.name,
        desc: item.desc,
        blast: item.blast,
      }
      if (item.damage !== 0) {
        proper.damage = item.damage;
      }
      return proper;
    }
  }

  async function addMagic(ev: CustomEvent<MagicType>) {
    const type = ev.detail;
    magicDialogTitle = `Add ${type}`;
    magicDialogDelete = false;
    magicForm = newItemForm();
    const item = await arcaneForm(type);
    if (item != null) {
      if (type === 'spell' && item.type === 'spell') {
        $character.spells = [...$character.spells, item];
      } else if (type === 'ritual' && item.type === 'ritual') {
        $character.rituals = [...$character.rituals, item];
      }
    }
  }

  async function editMagic(ev: CustomEvent<{id: string; type: MagicType}>) {
    const {id, type} = ev.detail;
    magicDialogTitle = `Edit ${type}`;
    magicDialogDelete = true;
    magicForm = newMagicForm({id, type});
    const item = await arcaneForm(type);
    if (item != null) {
      if (type === 'spell' && item.type === 'spell') {
        const index = $character.spells.findIndex(x => x.id === id);
        if (index >= 0) {
          $character.spells = [...$character.spells.slice(0, index), item, ...$character.spells.slice(index + 1)];
        }
      } else if (type === 'ritual' && item.type === 'ritual') {
        const index = $character.rituals.findIndex(x => x.id === id);
        if (index >= 0) {
          $character.rituals = [...$character.rituals.slice(0, index), item, ...$character.rituals.slice(index + 1)];
        }
      }
      
    }
  }

  function removeMagic(ev: CustomEvent<MagicForm>) {
    const id = ev.detail.id;
    const type = ev.detail.type;
    if (id && type) {
      if (type === 'spell') {
        $character.spells = $character.spells.filter(e => e.id !== id);
      } else {
        $character.rituals = $character.rituals.filter(e => e.id !== id);
      }
    }
  }
  
  async function takeDamage(ev: CustomEvent<{ type: 'str' | 'dex' | 'wil' }>) {
    const type = ev.detail.type;
    saveType = type.toUpperCase();
    const howmuch = await damageDialog.open();
    const chinfo: CharacterDetails = {
      type,
      equipment: $character.equipment,
      statuses: $character.statuses,
      grit: $character.grit.current,
      die: $character[type].current,
    };
    const results = calculateDamage(chinfo, howmuch);

    if (results == null) return;

    dieLabel = results.msg;
    dice = results.dice;
    if (results.statuses != null) {
      $character.statuses = results.statuses;
    }
    if (results.grit != null) {
      $character.grit.current = results.grit;
    }
    if (results.die != null) {
      $character[type].current = results.die;
    }
    notify.open();
  }
  
  function toggleStatus(status: string) {
    if ($character.statuses.has(status)) {
      $character.statuses.delete(status);
    } else {
      $character.statuses.add(status);
    }
    $character.statuses = $character.statuses;
  }
  
  $: isDeprived = $character.statuses.has(status.DEPRIVED);
  </script>
  <svelte:head>
    <title>{$character.name || 'Character Sheet'} :: Brighter Worlds Online</title>
  </svelte:head>
  <NotificationDialog title={dieLabel} {dice} bind:this={notify}/>
  <InputDialog title="How much potential {saveType} damage?" dice={[]} bind:this={damageDialog} form={damageForm}>
    <form class="text-center flex flex-col gap-3">
      <input type="text" inputmode="tel" name="damage" bind:value={damageForm.damage} class="rounded-full dark:bg-gray-900 dark:text-white focus:ring-purple-500 focus:border-purple-500">
      <div class="flex gap-4 items-center flex-wrap">
        <div class="flex gap-2 items-center">
          <Toggle bind:value={damageForm.bypassGrit} /> Bypass Grit 
        </div>
        <div class="flex gap-2 items-center">
          <Toggle bind:value={damageForm.bypassArmor} /> Bypass Armor 
        </div>
        <div class="flex gap-2 items-center">
          <Toggle bind:value={damageForm.overflow} /> Overflow 
        </div>
      </div>
    </form>
  </InputDialog>
  <InputDialog title={itemDialogTitle} showDelete={itemDialogDelete} dice={[]} bind:this={itemDialog} form={itemForm} on:delete={removeGear}>
    <form class="text-center flex flex-col gap-2">
      <input type="text" name="name" placeholder="Name" bind:value={itemForm.name} class="rounded-full dark:bg-gray-900 dark:text-white focus:ring-purple-500 focus:border-purple-500">
      <input type="text" name="desc" placeholder="Description" bind:value={itemForm.desc} class="rounded-full dark:bg-gray-900 dark:text-white focus:ring-purple-500 focus:border-purple-500">
      <div class="flex gap-4 items-center flex-wrap mt-4">
        <div class="flex gap-2 items-center">
          <Toggle bind:value={itemForm.bulky} /> Bulky 
        </div>
        <div class="flex gap-2 items-center">
          <Toggle bind:value={itemForm.enableMagic} /> Enable Magic 
        </div>
        <div class="flex gap-2 items-center">
          <input type="text" name="armor" size=5 inputmode="numeric" placeholder="Armor" bind:value={itemForm.armor} class="rounded-full dark:bg-gray-900 dark:text-white focus:ring-purple-500 focus:border-purple-500"> 
        </div>
        <div class="flex gap-2 items-center">
          <DieSelector bind:current={itemForm.damage} /> Damage 
        </div>
        {#if itemForm.damage !== 0}
        <div class="flex gap-2 items-center">
          <Toggle bind:value={itemForm.blast} /> Blast
        </div>
        {/if}
      </div>
    </form>
  </InputDialog>
  <InputDialog title={magicDialogTitle} showDelete={magicDialogDelete} dice={[]} bind:this={magicDialog} form={magicForm} on:delete={removeMagic}>
    <form class="text-center flex flex-col gap-2">
      <input type="text" name="name" placeholder="Name" bind:value={magicForm.name} class="rounded-full dark:bg-gray-900 dark:text-white focus:ring-purple-500 focus:border-purple-500">
      <input type="text" name="desc" placeholder="Description" bind:value={magicForm.desc} class="rounded-full dark:bg-gray-900 dark:text-white focus:ring-purple-500 focus:border-purple-500">
      <div class="flex gap-4 items-center flex-wrap mt-4">
        <div class="flex gap-2 items-center">
          <DieSelector bind:current={magicForm.damage} /> Damage 
        </div>
        {#if magicForm.damage !== 0}
        <div class="flex gap-2 items-center">
          <Toggle bind:value={magicForm.blast} /> Blast
        </div>
        {/if}
      </div>
    </form>
  </InputDialog>
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
              <button type="button" on:click={() => toggleStatus(status.DEPRIVED)} class="inline-flex items-center rounded border border-gray-300 bg-white dark:bg-gray-900 dark:border-gray-600 px-2.5 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2" class:bg-purple-200={isDeprived} class:border-purple-800={isDeprived} class:dark:bg-purple-800={isDeprived} class:dark:border-purple-200={isDeprived}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" class="-ml-0.5 mr-2 h-4 w-4 text-gray-400 dark:text-gray-500" class:!text-purple-800={isDeprived} class:dark:!text-purple-100={isDeprived}><path fill="currentColor" d="M35.2 126.3c4.1 1.1 8.4 1.7 12.8 1.7c26.5 0 48-21 48-47c0-5-1.8-11.3-4.6-18.1c-.3-.7-.6-1.4-.9-2.1c-8.9-20.2-26.5-44.9-36-57.5c-3.2-4.4-9.6-4.4-12.8 0C28.6 20.6 0 61 0 81c0 21.7 14.9 39.8 35.2 45.3zM256 0c-51.4 0-99.3 15.2-139.4 41.2c1.5 3.1 3 6.2 4.3 9.3c3.4 8 7.1 19 7.1 30.5c0 44.3-36.6 79-80 79c-9.6 0-18.8-1.7-27.4-4.8C7.3 186.2 0 220.2 0 256C0 397.4 114.6 512 256 512s256-114.6 256-256S397.4 0 256 0zM195.9 410.7c-5.9 6.6-16 7.1-22.6 1.2s-7.1-16-1.2-22.6C188.2 371.4 216.3 352 256 352s67.8 19.4 83.9 37.3c5.9 6.6 5.4 16.7-1.2 22.6s-16.7 5.4-22.6-1.2c-11.7-13-31.6-26.7-60.1-26.7s-48.4 13.7-60.1 26.7zM96 272c0-8.8 7.2-16 16-16h96c8.8 0 16 7.2 16 16s-7.2 16-16 16H112c-8.8 0-16-7.2-16-16zm208-16h96c8.8 0 16 7.2 16 16s-7.2 16-16 16H304c-8.8 0-16-7.2-16-16s7.2-16 16-16z"/></svg>
                Deprived
              </button>
              {#each Array.from($character.statuses.values()) as stat}
                {#if stat !== status.DEPRIVED}
                <button type="button" on:click={() => toggleStatus(stat)} class="inline-flex items-center rounded border border-purple-800 bg-purple-200 dark:bg-purple-800 dark:border-purple-200 px-2.5 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2">
                  {capitalize(stat)}
                </button>
                {/if}
              {/each}
            </div>
          </div>
        </div>
      </div>
      
      <Equipment equipment={$character.equipment} on:roll={damage} on:add={addGear} on:edit={editGear} />
  
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
      <Magic title="Spells" magic={$character.spells} on:roll={damage} type={'spell'} on:add={addMagic} on:edit={editMagic} />
      <Magic title="Rituals" magic={$character.rituals} on:roll={damage} type={'ritual'} on:add={addMagic} on:edit={editMagic} />

    </div>
  </div>
  <div class="text-center my-6">
    <MenuLink href="/character/">All Characters</MenuLink>
  </div>