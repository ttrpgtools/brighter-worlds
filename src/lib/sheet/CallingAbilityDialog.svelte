<script lang="ts">
  import InputDialog from "$lib/InputDialog.svelte";
  import type { Ability, AbilityType, Calling, CallingEnhancement, CallingEnhancements, CharacterChoice, EnhancementChoice, HasChoices } from "$lib/types";
  import { id } from "$lib/rolling/id";
  import { append, defined, remove, update } from "$lib/util/array";
  import GroupInputs from "$lib/GroupInputs.svelte";
  import Button from "$lib/Button.svelte";
  import fsm from 'svelte-fsm';
  import { onlyEnhancement } from "$lib/util/guards";

  export let abilities: Ability[];
  export let availableAbilities: (Ability & HasChoices)[];
  export let enhancements: CallingEnhancements[];

  interface AbilityForm {
    id?: string;
    name: string;
    desc: string;
    type: AbilityType;
    details: string;
  }

  let dialog: InputDialog<AbilityForm>;
  let title = '';
  let showDelete = false;
  let chosen: (Ability & HasChoices)[] = [];
  let form = newForm();
  let localChosen: Ability[] = [];
  let currentEnhancement: CallingEnhancements | undefined;
  let currentEnhancementCount = 0;
  let currentEnhancementOpts: CallingEnhancement[] = [];
  let availableEnhancements: CallingEnhancements[] = [];
  let enhancementMap = new Map<string, number>();
  let chosenEnhancements: CallingEnhancement[] = [];
  let okBtnLabel = availableEnhancements.length ? 'Next' : 'OK';
  
  const ui = fsm('init', {
    init: {
      start() {
        chosen = [];
        chosenEnhancements = [];
        return availableAbilities.length ? 'abilities' : 'companion'
      }
    },
    abilities: {
      _enter() {
        okBtnLabel = availableEnhancements.length ? 'Next' : 'OK';
      },
      tab(which: AbilityType) {
        return which === 'advanced' ? 'abilities' : 'companion';
      },
      choose(choice: (Ability & HasChoices)[]) {
        if (choice.length) {
          const {choices, ...abil} = choice[0];
          localChosen = [abil];
          enhancementMap = choices?.filter(onlyEnhancement).reduce((p, c) => p.set(c.table, (p.get(c.table) ?? 0) + 1), new Map<string, number>()) ?? new Map<string, number>();
          availableEnhancements = Array.from(enhancementMap.keys() ?? []).map(x => enhancements.find(y => y.id === x)).filter(defined);
          okBtnLabel = availableEnhancements.length ? 'Next' : 'OK';
        } else {
          localChosen = [];
          availableEnhancements = [];
          okBtnLabel = 'OK';
        }
        return 'abilities';
      },
      next() {
        return availableEnhancements.length ? 'enhancement' : 'done';
      }
    },
    companion: {
      _enter() {
        okBtnLabel = 'OK';
      },
      tab(which: AbilityType) {
        return which === 'advanced' ? 'abilities' : 'companion';
      },
      next: 'done'
    },
    enhancement: {
      _enter() {
        const [first, ...rest] = availableEnhancements;
        currentEnhancement = first;
        currentEnhancementCount = enhancementMap.get(first.id) ?? 1;
        const previous = new Set(abilities.filter(x => x.type === 'enhance' && x.details === first.type).map(x => x.name));
        currentEnhancementOpts = currentEnhancement?.options.map(x => ({...x, type: currentEnhancement?.type ?? ''})).filter(x => !previous.has(x.name)) ?? []
        availableEnhancements = rest;
        okBtnLabel = availableEnhancements.length ? 'Next' : 'OK';
      },
      next() {
        const newAbilities = chosenEnhancements.map(x => ({id: id(), name: x.name, desc: x.desc, type: 'enhance', details: x.type} as Ability));
        localChosen = [...newAbilities, ...localChosen];
        return availableEnhancements.length ? 'esave' : 'done';
      }
    },
    esave: {
      _enter() {
        (this.next as any).debounce(2)
      },
      next: 'enhancement'
    },
    done: {
      _enter() {
        dialog.close(form)
      }
    },
    '*': {
      reset: 'init'
    }
  });

  $: {
    ui.choose(chosen);
  }


  function newForm(id?: string) {
    if (id) {
      const item = abilities.find(x => x.id === id);
      if (item != null) {
        return {
          ...item,
        } as AbilityForm;
      }
    }
    return {
      name: '',
      desc: '',
      type: availableAbilities.length ? 'advanced' : 'companion',
      details: ''
    } as AbilityForm;
  }

  async function formResults() {
    const item = await dialog.open();
    if (item != null) {
      if (item.type === 'advanced' && showDelete === false) {
        return localChosen;
      } else {
        const proper: Ability = {
          ...item,
          details: item.details,
          name: item.name || '[no name]',
          id: item.id || id(),
        }
        return [proper];
      }
    }
  }

  export async function add() {
    ui.start();
    title = 'Add ability';
    showDelete = false;
    form = newForm();
    const items = await formResults();
    if (items != null) {
      abilities = append(abilities, items);
    }
    ui.reset();
  }

  export async function edit(id: string) {
    ui.start();
    title = 'Edit ability';
    showDelete = true;
    form = newForm(id);
    const item = await formResults();
    if (item != null && item.length) {
      abilities = update(abilities, item[0]);
    }
    ui.reset();
  }

  function del(ev: CustomEvent<AbilityForm>) {
    const id = ev.detail.id;
    if (id) {
      abilities = remove(abilities, id);
    }
  }
  function tab(type: AbilityType) {
    form.type = type;
    ui.tab(type);
  }
</script>
<InputDialog {title} {showDelete} dice={[]} bind:this={dialog} form={form} on:delete={del} {okBtnLabel} okBtnAction={ui.next}>
  {#if showDelete}
  <form class="text-center flex flex-col gap-2">
    <input type="text" name="name" placeholder="Name" bind:value={form.name} class="rounded-full dark:bg-gray-900 dark:text-white focus:ring-purple-500 focus:border-purple-500 flex-grow">
    <input type="text" name="desc" placeholder="Description" bind:value={form.desc} class="rounded-full dark:bg-gray-900 dark:text-white focus:ring-purple-500 focus:border-purple-500 flex-grow">
    <input type="text" name="details" placeholder="Type" bind:value={form.details} class="rounded-full dark:bg-gray-900 dark:text-white focus:ring-purple-500 focus:border-purple-500 flex-grow">
  </form>
  {:else}
  <div class="">
    {#if $ui === 'enhancement' || $ui === 'esave'}
      <h4 class="text-xl font-subtitle leading-6 text-center">{currentEnhancement?.name} ({currentEnhancementCount})</h4>
      <p class="max-w-prose text-sm mb-3 text-center">{currentEnhancement?.desc}</p>
      <GroupInputs options={currentEnhancementOpts} max={currentEnhancementCount} bind:selected={chosenEnhancements} let:opt>
      {opt.desc}
      </GroupInputs>
    {:else}
      {#if availableAbilities.length}
      <div class="flex gap-4 items-center justify-center mb-4">
        <button on:click={() => tab('advanced')} type="button" class="text-xl font-subtitle leading-6 relative top-px whitespace-nowrap py-5 px-2 border-b-3 {$ui === 'abilities' ? 'text-purple-700 dark:text-purple-300 border-purple-500' : 'border-transparent hover:border-gray-500'}">
          Ability
        </button>
        <button on:click={() => tab('companion')} type="button" class="text-xl font-subtitle leading-6 relative top-px whitespace-nowrap py-5 px-2 border-b-3 {$ui === 'companion' ? 'text-purple-700 dark:text-purple-300 border-purple-500' : 'border-transparent hover:border-gray-500'}">
          General
        </button>
      </div>
      {/if}
      {#if $ui === 'abilities'}
      <div class="">
        <GroupInputs options={availableAbilities} bind:selected={chosen} max={1} let:opt>
          {@html opt.desc}
        </GroupInputs>
      </div>
      {:else if $ui === 'companion'}
      <div>
        <form class="text-center flex flex-col gap-2">
          <input type="text" name="name" data-1p-ignore placeholder="Name" bind:value={form.name} class="rounded-full dark:bg-gray-900 dark:text-white focus:ring-purple-500 focus:border-purple-500 flex-grow">
          <input type="text" name="desc" placeholder="Description" bind:value={form.desc} class="rounded-full dark:bg-gray-900 dark:text-white focus:ring-purple-500 focus:border-purple-500 flex-grow">
          <input type="text" name="details" placeholder="Type" bind:value={form.details} class="rounded-full dark:bg-gray-900 dark:text-white focus:ring-purple-500 focus:border-purple-500 flex-grow">
        </form>
      </div>
      {/if}
    {/if}
  </div>
  {/if}
</InputDialog>