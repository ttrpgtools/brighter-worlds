<script lang="ts">
  import Card from '$lib/ui/card.svelte';
  import DeleteButton from '$lib/DeleteButton.svelte';
  import Disclosable from '$lib/Disclosable.svelte';
  import Icon from '$lib/ui/icon.svelte';
  import Button from '$lib/ui/button.svelte';
  import DieSelector from '$lib/sheet/DieSelector.svelte';
  import Equipment from '$lib/sheet/Equipment.svelte';
  import RollSelector from '$lib/sheet/RollSelector.svelte';
  import type { DieMod, DieRollSet, NpcInstance } from '$lib/types';

  interface Props {
    npc: NpcInstance;
    onshare: () => void;
    ondamage: (mod: DieMod | undefined) => void;
    ondelete: () => void;
    onroll: (data: { dice: DieRollSet; name: string }) => void;
  }

  let { npc = $bindable(), onshare, ondamage, ondelete, onroll }: Props = $props();
  let src = $derived(typeof npc.image === 'string' ? npc.image : '');

  function takeDamage(ev: { dice: DieRollSet }) {
    ondamage(ev.dice.mod);
  }
</script>

<Disclosable
  overflowable
  short
  imgalt={`Photo of ${npc.name}`}
  imgsrc={src}
  imgclass="lg:rounded-bl-lg max-h-36 self-end"
>
  {#snippet header()}
    <div class="relative w-full flex items-center">
      <Icon icon="nav-bestiary" />
      <input
        type="text"
        class="w-full border-0 relative py-1 top-0.5 dark:bg-gray-900 placeholder-shown:bg-gray-100 dark:placeholder-shown:bg-black focus:border-purple-600 focus:ring-0 font-subtitle text-xl h-full"
        placeholder="Name"
        bind:value={npc.name}
      />
      <div class="absolute inset-y-0 gap-3 right-0 flex items-center">
        <Button size="icon" icon="share" onclick={onshare} />
        <DeleteButton onconfirm={ondelete} size="w-3 h-3" />
      </div>
    </div>
  {/snippet}
  <div class="relative flex flex-col gap-2">
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <div class="grid grid-cols-4 gap-2">
          <input
            type="number"
            min="0"
            max="12"
            class="block accent-purple-500 text-lg py-2 px-3 rounded-md border-gray-300 bg-white dark:bg-gray-900 dark:hover:bg-gray-800 dark:border-gray-600 shadow-sm focus:border-purple-500 focus:ring-purple-500"
            bind:value={npc.grit.current}
          />
          <DieSelector
            bind:current={npc.str.current}
            nullable
            invalid={npc.str.current > npc.str.max}
          />
          <DieSelector
            bind:current={npc.dex.current}
            nullable
            invalid={npc.dex.current > npc.dex.max}
          />
          <DieSelector
            bind:current={npc.wil.current}
            nullable
            invalid={npc.wil.current > npc.wil.max}
          />

          <RollSelector class="justify-self-center" label="" die={4} onroll={takeDamage}>
            {#snippet children({ events })}
              <button
                aria-label="Take d4 Damage"
                use:events
                type="button"
                class="inline-flex items-center rounded-full border border-transparent bg-purple-300 dark:bg-purple-700 px-4 py-2 text-xs font-medium shadow-sm hover:bg-purple-200 dark:hover:bg-purple-800 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-900"
                title="Take d4 Damage"><Icon icon="damage" /></button
              >
            {/snippet}
          </RollSelector>
          <RollSelector
            class="justify-self-center"
            label="STR Save"
            die={npc.str.current || 4}
            {onroll}
          >
            {#snippet children({ events })}
              <button
                use:events
                type="button"
                title="Roll STR Save"
                class="font-subtitle text-xl bg-purple-300 dark:bg-purple-700 hover:bg-purple-200 dark:hover:bg-purple-800 rounded-full px-2 pt-2 pb-1 w-16 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-900"
                >STR</button
              >
            {/snippet}
          </RollSelector>
          <RollSelector
            class="justify-self-center"
            label="DEX Save"
            die={npc.dex.current || 4}
            {onroll}
          >
            {#snippet children({ events })}
              <button
                use:events
                type="button"
                title="Roll DEX Save"
                class="font-subtitle text-xl bg-purple-300 dark:bg-purple-700 hover:bg-purple-200 dark:hover:bg-purple-800 rounded-full px-2 pt-2 pb-1 w-16 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-900"
                >DEX</button
              >
            {/snippet}
          </RollSelector>
          <RollSelector
            class="justify-self-center"
            label="WIL Save"
            die={npc.wil.current || 4}
            {onroll}
          >
            {#snippet children({ events })}
              <button
                use:events
                type="button"
                title="Roll WIL Save"
                class="font-subtitle text-xl bg-purple-300 dark:bg-purple-700 hover:bg-purple-200 dark:hover:bg-purple-800 rounded-full px-2 pt-2 pb-1 w-16 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-900"
                >WIL</button
              >
            {/snippet}
          </RollSelector>
          {#if npc.status}
            <div class="col-span-4">
              <div
                class="flex items-center gap-2 border w-fit py-2 px-3 rounded-md border-gray-300 bg-white dark:bg-gray-900 dark:hover:bg-gray-800 dark:border-gray-600 shadow-sm"
              >
                <span>{npc.status}</span>
                <button
                  type="button"
                  title="Clear status"
                  aria-label="Clear status"
                  onclick={() => (npc.status = '')}
                  class="rounded-md bg-purple-900 p-0.5 text-white shadow-sm hover:bg-purple-700 focus-visible:outline focus-visible:outline-offset-2 focus-visible:outline-purple-600"
                >
                  <svg
                    class="h-5 w-5 rotate-45"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z"
                    />
                  </svg>
                </button>
              </div>
            </div>
          {/if}
        </div>
      </div>
      <div class="flex flex-col gap-4">
        <Equipment
          bind:equipment={npc.attacks}
          title="Attacks"
          bind:baseArmor={npc.armor}
          class="flex-1"
          {onroll}
          flat
          onshare={() => {}}
        />
        {#if (npc.wants || npc.found) && npc.notes?.length > 120}
          <Card>
            <div>
              <ul class="-my-5 divide-y divide-gray-200 dark:divide-gray-600">
                {#if npc.notes?.length > 0}
                  {#each npc.notes as note}
                    <li class="py-3">
                      <p class="text-sm font-medium">{note}</p>
                    </li>
                  {/each}
                {/if}
                {#if npc.wants}
                  <li class="py-3">
                    <p class="text-sm font-medium">
                      <strong class="text-purple-700 dark:text-purple-200">Wants:</strong>
                      {npc.wants}
                    </p>
                  </li>
                {/if}
                {#if npc.found}
                  <li class="py-3">
                    <p class="text-sm font-medium">
                      <strong class="text-purple-700 dark:text-purple-200">Often Found:</strong>
                      {npc.found}
                    </p>
                  </li>
                {/if}
              </ul>
            </div>
          </Card>
        {/if}
      </div>
    </div>
  </div>
</Disclosable>
