<script lang="ts">
  import type { Calling } from "$lib/types";
  import MenuLink from "$lib/MenuLink.svelte";
  import CallingSummary from "./CallingSummary.svelte";
  import { STEP, getWizard } from "./wizard";
  import type { PageData } from "./$types";
  import HomeLink from "$lib/HomeLink.svelte";
  export let data: PageData;

  const [wizard] = getWizard();

  if ($wizard !== STEP.CALLING) {
    wizard.reset();
  }

  function startWizard(calling: Calling) {
    wizard.setCalling(calling, data.spells, data.rituals);
  }
</script>
<HomeLink />
<div class="max-w-prose text-center mb-4 text-2xl font-subtitle">
  Find your Calling adventurer! What drives you forward?
</div>
<div class="max-w-prose text-left mb-6 text-md">
  All characters are generalists. Everyone can swing a sword, sneak around, or cast a spell (given access to a Grimoire). These Callings define the things that put you ahead of the pack, give you an extra edge or let you break the rules.
</div>
<div class="rounded-md bg-yellow-100 dark:bg-amber-800 p-4 mb-6 max-w-prose">
  <div class="flex">
    <div class="flex-shrink-0">
      <svg class="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
        <path fill-rule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clip-rule="evenodd" />
      </svg>
    </div>
    <div class="ml-3 text-sm text-yellow-800 dark:text-yellow-100">
      <p>Note that for the moment, any characters created here are saved locally in this browser. They will not be available on another device or browser.</p>
    </div>
  </div>
</div>
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6 max-w-7xl">
  {#each data.list as calling}
    <CallingSummary calling={calling} on:click={() => startWizard(calling)} />
  {/each}
</div>
<MenuLink href="/" icon="logo-leaf">Home</MenuLink>