<script lang="ts">
  import InputDialog from "$lib/InputDialog.svelte";
  import type { Ability, AbilityType, Calling, CharacterChoice, HasChoices } from "$lib/types";
  import { id } from "$lib/rolling/id";
  import { append, remove, update } from "$lib/util/array";
  import GroupInputs from "$lib/GroupInputs.svelte";

  export let abilities: Ability[];
  export let callingData: Calling;

  interface AbilityForm {
    id?: string;
    name: string;
    desc: string;
    type: AbilityType;
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
      name: 'Not working yet.',
      desc: '',
      type: 'companion',
      details: 'Yikes'
    } as AbilityForm;
  }

  let dialog: InputDialog<AbilityForm>;
  let title = '';
  let showDelete = false;
  let form = newForm();
  let chosen: Ability[] = [];
  const [_, advancedAbilities] = callingData.abilities.filter(x => x.type === 'advanced').reduce((p, {choices, ...rest}) => ([
        [...p[0], ...(choices ?? [])],
        [...p[1], rest as Ability]
      ]), [[] as CharacterChoice[], [] as Ability[]]);
  $: availableAbililties = advancedAbilities.filter(x => !abilities.some(y => y.id === x.id));

  async function formResults() {
    const item = await dialog.open();
    if (item != null) {
      const proper: Ability = {
        ...item,
        id: item.id || id(),
      }
      return proper;
    }
  }

  export async function add() {
    title = 'Add ability';
    showDelete = false;
    form = newForm();
    const item = await formResults();

    if (chosen.length === 1) {
      abilities = append(abilities, chosen[0]);
    }
  }

  export async function edit(id: string) {
    title = 'Edit ability';
    showDelete = true;
    form = newForm(id);
    const item = await formResults();
    if (item != null) {
      abilities = update(abilities, item);
    }
  }

  function del(ev: CustomEvent<AbilityForm>) {
    const id = ev.detail.id;
    if (id) {
      abilities = remove(abilities, id);
    }
  }
</script>
<InputDialog {title} {showDelete} dice={[]} bind:this={dialog} form={form} on:delete={del}>
  {#if showDelete}
  <form class="text-center flex flex-col gap-2">
    <input type="text" name="name" placeholder="Name" bind:value={form.name} class="rounded-full dark:bg-gray-900 dark:text-white focus:ring-purple-500 focus:border-purple-500 flex-grow">
    <input type="text" name="desc" placeholder="Description" bind:value={form.desc} class="rounded-full dark:bg-gray-900 dark:text-white focus:ring-purple-500 focus:border-purple-500 flex-grow">
  </form>
  {:else}
  <GroupInputs options={availableAbililties} bind:selected={chosen} max={1} let:opt>
    {@html opt.desc}
  </GroupInputs>
  {/if}
</InputDialog>