<script lang="ts">
import { Die } from "$lib/dice";
import type { DieValue } from "$lib/types";
export let current: DieValue;

const dice: DieValue[] = [4, 6, 8, 10, 12];

let open = false;

function toggle() {
  open = !open;
}

function select(d: DieValue) {
  current = d;
  open = false;
}

function press(ev: KeyboardEvent, d: DieValue) {
  if (ev.key === 'Enter') {
    select(d);
  }
}
</script>
<div class="relative mt-1">
  <button type="button" on:click={toggle} class="relative w-full cursor-default rounded-md border border-gray-300 bg-white py-2 pl-3 pr-10 text-left shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm" aria-haspopup="listbox" aria-expanded="true" aria-labelledby="listbox-label">
    <span class="flex items-center">
      <Die which={current} />
    </span>
    <span class="pointer-events-none absolute inset-y-0 right-0 ml-3 flex items-center pr-2">
      <!-- Heroicon name: mini/chevron-up-down -->
      <svg class="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
        <path fill-rule="evenodd" d="M10 3a.75.75 0 01.55.24l3.25 3.5a.75.75 0 11-1.1 1.02L10 4.852 7.3 7.76a.75.75 0 01-1.1-1.02l3.25-3.5A.75.75 0 0110 3zm-3.76 9.2a.75.75 0 011.06.04l2.7 2.908 2.7-2.908a.75.75 0 111.1 1.02l-3.25 3.5a.75.75 0 01-1.1 0l-3.25-3.5a.75.75 0 01.04-1.06z" clip-rule="evenodd" />
      </svg>
    </span>
  </button>

  <!--
    Select popover, show/hide based on select state.

    Entering: ""
      From: ""
      To: ""
    Leaving: "transition ease-in duration-100"
      From: "opacity-100"
      To: "opacity-0"
  -->
  {#if open}
  <ul class="absolute z-10 mt-1 max-h-56 overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm" tabindex="-1" role="listbox" aria-labelledby="listbox-label" aria-activedescendant="listbox-option-3">
    {#each dice as die}
    <!--
      Select option, manage highlight styles based on mouseenter/mouseleave and keyboard navigation.

      Highlighted: "text-white bg-indigo-600", Not Highlighted: "text-gray-900"
    -->
    <li class="text-gray-900 relative cursor-default select-none py-2 px-3" role="option" aria-selected={current === die} class:bg-purple-600={current === die} class:text-white={current === die} on:click={() => select(die)} on:keydown={(ev) => press(ev, die)}>
      <div class="flex items-center gap-2">
        <Die which={die}/> d{die}
      </div>
    </li>
    {/each}
    <!-- More items... -->
  </ul>
  {/if}
</div>