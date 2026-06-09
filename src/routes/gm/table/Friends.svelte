<script lang="ts">
  import InputDialog from '$lib/InputDialog.svelte';
  import { Die } from '$lib/dice';
  import type { NpcStats } from '$lib/types';
  import Button from '$lib/ui/button.svelte';
  import Card from '$lib/ui/card.svelte';
  import { getFriends, type FriendRollResult, type FriendSlot } from './friend-state.svelte';

  interface Props {
    npcList?: NpcStats[];
    onroll?: (result: FriendRollResult, noMat: boolean) => void;
    onadd?: (friend: FriendSlot) => void;
  }

  interface FriendForm {
    id?: string;
    index: number;
    name: string;
    notes: string;
    sourceNpcId: string;
  }

  let { npcList = [], onroll, onadd }: Props = $props();

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

  export async function rollFriend(noMat = false) {
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
    onroll?.(finalResult, noMat);
    return finalResult;
  }

  function removeSlot() {
    friends.removeSlot(form.index);
    dialog?.close();
  }

  function slotClass(index: number) {
    return selectedIndex === index
      ? 'border-purple-500 bg-purple-100 dark:bg-purple-950'
      : 'border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-950';
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
        <Button size="sm" variant="outline" disabled={!form.sourceNpcId} onclick={useNpcName}
          >Use</Button
        >
      </div>
    {/if}
  </form>
</InputDialog>

<Card>
  {#snippet header()}
    <div class="pr-2">
      <h3 class="text-xl font-subtitle leading-6">Friends!</h3>
    </div>
    <button
      type="button"
      aria-label="Roll Friend die"
      title="Roll Friend die"
      onclick={() => rollFriend()}
      class="inline-flex items-center rounded-full bg-purple-300 p-1 shadow-sm transition hover:bg-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-purple-700 dark:hover:bg-purple-800"
    >
      <Die which={friends.roster.die} size="h-5 w-5" />
    </button>
  {/snippet}

  <div class="flex flex-col gap-2">
    <div class="flex flex-col gap-2">
      {#each slotIndexes as index}
        {@const slot = friends.getSlot(index)}
        <div class="flex gap-2">
          <button
            type="button"
            onclick={() => editSlot(index)}
            class="min-h-11 flex-1 rounded-lg border px-3 py-2 text-left transition hover:border-purple-400 {slotClass(
              index,
            )}"
          >
            <div class="flex items-center gap-3">
              <div
                class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gray-100 text-sm font-medium dark:bg-gray-800"
              >
                {index}
              </div>
              <div class="min-w-0 flex-1 truncate font-medium">
                {slot?.name ?? 'Empty'}
              </div>
            </div>
          </button>
          {#if slot && onadd}
            <div class="flex items-center">
              <Button
                aria-label="Add Friend to playmat"
                title="Add Friend to playmat"
                size="tight"
                icon="plus"
                iconClass="size-4"
                onclick={() => onadd?.(slot)}
              />
            </div>
          {/if}
        </div>
      {/each}
    </div>
  </div>
</Card>
