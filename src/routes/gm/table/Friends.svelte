<script lang="ts">
  import InputDialog from '$lib/InputDialog.svelte';
  import { Die } from '$lib/dice';
  import type { DieValue, NpcStats } from '$lib/types';
  import Button from '$lib/ui/button.svelte';
  import Card from '$lib/ui/card.svelte';
  import { getFriends, type FriendRollResult, type FriendSlot } from './friend-state.svelte';

  interface Props {
    npcList?: NpcStats[];
    onroll?: (result: FriendRollResult) => void;
  }

  interface FriendForm {
    id?: string;
    index: number;
    name: string;
    notes: string;
    sourceNpcId: string;
  }

  let { npcList = [], onroll }: Props = $props();

  const friends = getFriends();

  let dialog: InputDialog<FriendForm> | undefined = $state();
  let form: FriendForm = $state(newForm(1));
  let selectedIndex: number | undefined = $state();

  let slotIndexes = $derived(Array.from({ length: friends.roster.die }, (_, i) => i + 1));
  let valid = $derived(!!form.name.trim());

  function newForm(index: number): FriendForm {
    return {
      index,
      name: '',
      notes: '',
      sourceNpcId: '',
    };
  }

  function editForm(index: number, slot?: FriendSlot): FriendForm {
    return {
      id: slot?.id,
      index,
      name: slot?.name ?? '',
      notes: slot?.notes ?? '',
      sourceNpcId: slot?.sourceNpcId ?? '',
    };
  }

  function currentNpc() {
    return npcList.find((npc) => npc.id === form.sourceNpcId);
  }

  function useNpcName() {
    const npc = currentNpc();
    if (npc) form.name = npc.name;
  }

  async function editSlot(index: number) {
    selectedIndex = index;
    form = editForm(index, friends.getSlot(index));
    const result = await dialog?.open();
    if (result) {
      friends.upsertSlot(result);
    }
  }

  async function fillRolledSlot(result: FriendRollResult) {
    selectedIndex = result.roll;
    form = newForm(result.roll);
    const item = await dialog?.open();
    if (item) {
      friends.upsertSlot(item);
      return true;
    }
    return false;
  }

  export async function rollFriend() {
    const result = friends.rollFriend();
    selectedIndex = result.roll;
    if (result.empty) {
      await fillRolledSlot(result);
    }
    const finalSlot = friends.getSlot(result.roll);
    const finalResult = {
      ...result,
      friend: finalSlot,
      empty: !finalSlot,
    };
    friends.lastRoll = finalResult;
    onroll?.(finalResult);
    return finalResult;
  }

  function removeSlot() {
    friends.removeSlot(form.index);
    dialog?.close();
  }

  function selectedClass(index: number) {
    return selectedIndex === index
      ? 'border-purple-500 bg-purple-100 dark:bg-purple-950'
      : 'border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-950';
  }

  function dieLabel(die: DieValue) {
    return `d${die}`;
  }
</script>

<InputDialog
  title="Friend"
  bind:this={dialog}
  {form}
  {valid}
  showDelete={!!friends.getSlot(form.index)}
  ondelete={removeSlot}
>
  <form class="text-center flex flex-col gap-2">
    <div class="text-sm text-gray-600 dark:text-gray-300">Slot {form.index}</div>
    <input
      type="text"
      data-1p-ignore
      name="name"
      placeholder="Name"
      bind:value={form.name}
      class="rounded-full dark:bg-gray-900 dark:text-white focus:ring-purple-500 focus:border-purple-500"
    />
    <textarea
      name="notes"
      placeholder="Notes"
      bind:value={form.notes}
      class="min-h-24 rounded-xl dark:bg-gray-900 dark:text-white focus:ring-purple-500 focus:border-purple-500"
    ></textarea>
    {#if npcList.length}
      <div class="flex gap-2">
        <select
          bind:value={form.sourceNpcId}
          class="min-w-0 flex-1 rounded-full dark:bg-gray-900 dark:text-white focus:ring-purple-500 focus:border-purple-500"
        >
          <option value="">No linked NPC</option>
          {#each npcList as npc}
            <option value={npc.id}>{npc.name}</option>
          {/each}
        </select>
        <Button
          size="sm"
          variant="outline"
          icon="person"
          disabled={!form.sourceNpcId}
          onclick={useNpcName}>Use</Button
        >
      </div>
    {/if}
  </form>
</InputDialog>

<Card>
  {#snippet header()}
    <div class="pr-2">
      <h3 class="text-xl font-subtitle leading-6">Friends!</h3>
      <div class="mt-1 text-sm text-gray-600 dark:text-gray-300">
        Friend die: {dieLabel(friends.roster.die)}
      </div>
    </div>
    <Button icon="d6" onclick={rollFriend}>Roll</Button>
  {/snippet}

  <div class="flex flex-col gap-4">
    {#if friends.lastRoll}
      <div
        class="rounded-lg border border-purple-200 bg-purple-50 px-3 py-2 text-sm dark:border-purple-800 dark:bg-purple-950"
      >
        <div class="flex items-center gap-2">
          <Die which={friends.lastRoll.die} />
          <span>
            Slot {friends.lastRoll.roll}: {friends.lastRoll.friend?.name ?? 'New Friend'}
          </span>
        </div>
      </div>
    {/if}

    <div class="grid grid-cols-1 gap-2 sm:grid-cols-2">
      {#each slotIndexes as index}
        {@const slot = friends.getSlot(index)}
        <button
          type="button"
          onclick={() => editSlot(index)}
          class="min-h-20 rounded-lg border p-3 text-left transition hover:border-purple-400 {selectedClass(
            index,
          )}"
        >
          <div class="flex items-start gap-3">
            <div
              class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-100 text-sm font-medium dark:bg-gray-800"
            >
              {index}
            </div>
            <div class="min-w-0 flex-1">
              <div class="truncate font-medium">
                {slot?.name ?? 'Empty'}
              </div>
              <div class="line-clamp-2 text-sm text-gray-600 dark:text-gray-300">
                {slot?.notes || (slot ? 'No notes' : 'Click to add a Friend')}
              </div>
            </div>
          </div>
        </button>
      {/each}
    </div>
  </div>
</Card>
