<script lang="ts">
import { Die } from "$lib/dice";
import type { Magic } from "$lib/types";
import { onEnter } from "$lib/util/handlers";
import { createEventDispatcher } from "svelte";
import Card from "../Card.svelte";
import MagicDialog from "./MagicDialog.svelte";
type T = $$Generic<Magic>
export let magicList: T[];
export let title: string;
type TType = T["type"]
export let type: TType;

let dialog: MagicDialog<T>;

const dispatch = createEventDispatcher();
function rollDamage(ev: MouseEvent, item: Magic) {
  if (item.damage == null) return;
  const dice = [ev.altKey ? 4 : item.damage];
  if (!ev.altKey && ev.metaKey) {
    dice.push(12);
  }
  dispatch('roll', { dice, name: item.name });
}

function addMagic() {
  dialog.addMagic();
}

function editMagic(id: string) {
  dialog.editMagic(id);
}
</script>
<MagicDialog bind:magicList {type} bind:this={dialog} />
<Card class="md:h-[25rem]">
  <svelte:fragment slot="header">
    <div class="">
      <h3 class="text-xl font-subtitle leading-6">{title}</h3>
    </div>
    <div class="flex-shrink-0">
      <div class="flex gap-4 items-center">
        <button type="button" on:click={addMagic} class="relative inline-flex items-center rounded-full bg-purple-300 dark:bg-purple-700 p-1 font-medium shadow-sm hover:bg-purple-200 dark:hover:bg-purple-800 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-900"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" class="h-4 w-4"><path fill="currentColor" d="M256 80c0-17.7-14.3-32-32-32s-32 14.3-32 32V224H48c-17.7 0-32 14.3-32 32s14.3 32 32 32H192V432c0 17.7 14.3 32 32 32s32-14.3 32-32V288H400c17.7 0 32-14.3 32-32s-14.3-32-32-32H256V80z"/></svg></button>
      </div>
    </div>
  </svelte:fragment>
  <!-- body -->
  <div>
    <div class="flow-root">
      <ul class="-my-5 divide-y divide-gray-200 dark:divide-gray-600">
        {#each magicList as arcana (arcana.id)}
        <li class="py-3">
          <div class="flex items-center space-x-4 h-6">
            <div class="min-w-0 flex-1 flex gap-4">
              <p class="truncate text-sm font-medium cursor-pointer" title={arcana.name} on:click={() => editMagic(arcana.id)} on:keydown={onEnter(() => editMagic(arcana.id))}>{arcana.name}</p>
              
            </div>
            <div class="flex gap-2 items-center">
              {#if arcana.damage}<button on:click={(ev) => rollDamage(ev, arcana)} class="inline-flex items-center text-sm font-medium leading-5"><Die which={arcana.damage}/></button>{/if}
            </div>
          </div>
          {#if arcana.desc}<p class="text-sm text-gray-600 dark:text-gray-400 truncate" title={arcana.desc}>{arcana.desc}</p>{/if}
        </li>
        {:else}
        <li class="py-3 italic text-gray-600 dark:text-gray-400">No magic here.</li>
        {/each}
      </ul>
    </div>
  </div>

</Card>