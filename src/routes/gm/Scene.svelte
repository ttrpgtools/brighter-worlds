<script lang="ts">
  import Icon from "$lib/Icon.svelte";
  import type { Entity } from "$lib/types";
  import { createEventDispatcher } from "svelte";

  export let scene: Entity;
  $: src = typeof(scene.image) === 'string' ? scene.image : '';

  const dispatch = createEventDispatcher();
</script>

<div class="relative rounded-lg group/scene bg-white shadow-xl dark:bg-gray-900 dark:shadow-purple-400/20 ring-1 flex flex-col lg:flex-row ring-gray-900/5">
  {#if src}<img alt="header" {src} class="lg:rounded-l-lg max-w-sm">{/if}
  <div class="px-4 py-5 sm:p-6 flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
    <div class="flex flex-col items-start gap-2">
      <h3 class="text-xl font-subtitle leading-6 flex-1 flex items-center gap-2">{#if scene.icon}<Icon icon={scene.icon}/>{/if}<span class="relative top-0.5">{scene.name}</span></h3>
      <p>{scene.desc}</p>
    </div>
  </div>
  <button type="button" on:click={() => dispatch('remove')} class="hidden absolute top-2 right-2 text-lg rounded-full leading-none h-6 w-6 bg-purple-300 dark:bg-purple-900 group-hover/scene:flex items-center justify-center"><span class="relative -top-px">&times;</span></button>
</div>