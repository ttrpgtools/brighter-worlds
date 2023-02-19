<script lang="ts">
  import { builder, STEP, wizard } from "../wizard";
  import { goto } from "$app/navigation";
  import { browser } from "$app/environment";
  import Button from "$lib/Button.svelte";
  import type { PageData } from "./$types";

  export let data: PageData;
  $: advanced = data.list.find(x => x.id === $builder.calling?.id)?.abilities.filter(x => x.type === 'advanced') ?? [];
  let group = '';
  $: chosen = advanced.find(x => x.id === group);

  if ($wizard !== STEP.ABILITIES && browser) {
    goto(`/character/new`);
  }

  function forward() {
    wizard.setAbilities(chosen ? [chosen] : []);
  }
</script>

<h3 class="max-w-prose text-center mb-4 text-lg">Choose your starting advanced ability</h3>
<p class="max-w-prose text-center mb-6">You can get more later with XP</p>
<div class="mx-auto w-full max-w-md">
  <fieldset class="flex flex-col space-y-2">
  {#each advanced as aa}
  <div class="relative">
    <input id={aa.id} class="absolute opacity-0 w-0 h-0 peer" type="radio" bind:group name="type" value={aa.id} />
    <label
      for={aa.id}
      class="[&_p]:text-gray-900 [&_span]:text-gray-500 peer-checked:[&_p]:text-white peer-checked:[&_span]:text-sky-100 peer-focus:ring-2 peer-focus:ring-white peer-focus:ring-opacity-60 peer-focus:ring-offset-2 peer-focus:ring-offset-sky-300 bg-white relative flex cursor-pointer rounded-lg px-5 py-4 shadow-md focus:outline-none peer-checked:bg-sky-900/75 peer-checked:text-white"
    >
      <div class="flex w-full items-center justify-between">
        <div class="flex items-center">
          <div class="text-sm">
            <p class="font-bold">{aa.name}</p>
            {@html aa.desc}
          </div>
        </div>
        <div class="shrink-0 text-white">
          <svg viewBox="0 0 24 24" fill="none" class="h-6 w-6">
            <circle cx="12" cy="12" r="12" fill="#fff" opacity="0.2" /><path
              d="M7 13l3 3 7-7"
              stroke="#fff"
              stroke-width="1.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </div>
      </div>
    </label>
  </div>
  {/each}
  </fieldset>
</div>  

<Button on:click={forward}>Next</Button>
