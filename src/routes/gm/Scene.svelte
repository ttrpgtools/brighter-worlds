<script lang="ts">
  import Icon from "$lib/Icon.svelte";
  import IconButton from "$lib/IconButton.svelte";
  import { renderSafe } from "$lib/md/render";
  import type { Scene } from "$lib/types";
  import { createEventDispatcher } from "svelte";

  export let scene: Scene;
  $: src = typeof(scene.image) === 'string' ? scene.image : '';

  const dispatch = createEventDispatcher();
</script>

<div class="relative rounded-lg group/scene bg-white shadow-xl dark:bg-gray-900 dark:shadow-purple-400/20 ring-1 flex flex-col lg:flex-row ring-gray-900/5">
  {#if src}<img alt="header" {src} class="lg:rounded-l-lg max-w-xs">{/if}
  <div class="px-4 py-5 sm:p-6 flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
    <div class="flex flex-col items-start gap-2">
      <h3 class="text-xl font-subtitle leading-6 flex-1 flex items-center gap-2">{#if scene.icon}<Icon icon={scene.icon}/>{/if}<span class="relative top-0.5">{scene.name}</span></h3>
      <p>{scene.desc}</p>
    </div>
    {#if scene.gmnotes}
    <div class="mt-4 bg-purple-100 dark:bg-purple-950 border-3 p-2 prose dark:prose-invert prose-purple prose-blockquote:border-purple-600 dark:prose-blockquote:border-purple-400 prose-blockquote:bg-purple-200 dark:prose-blockquote:bg-purple-800 border-dashed rounded-lg border-purple-300 dark:border-purple-600">
      {@html renderSafe(scene.gmnotes)}
    </div>
    {/if}
  </div>
  <div class="hidden absolute top-2 right-2 group-hover/scene:flex gap-3">
    <IconButton icon="share" on:click={() => dispatch('share')} size="0.75rem" padding="py-1 px-1.5" />
    <button type="button" on:click={() => dispatch('remove')} class="text-lg rounded-full leading-none h-6 w-6 bg-purple-300 dark:bg-purple-900 flex items-center justify-center"><span class="relative -top-px">&times;</span></button>
  </div>
</div>