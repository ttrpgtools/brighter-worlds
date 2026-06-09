<script lang="ts">
  import Icon from '$lib/ui/icon.svelte';
  import Button from '$lib/ui/button.svelte';
  import { renderSafe } from '$lib/md/render';
  import type { Scene } from '$lib/types';

  interface Props {
    scene: Scene;
    onshare: () => void;
    onremove: () => void;
  }

  let { scene, onremove, onshare }: Props = $props();
  let src = $derived(typeof scene.image === 'string' ? scene.image : '');
</script>

<div
  class="relative rounded-lg group/scene bg-white shadow-xl dark:bg-gray-900 dark:shadow-purple-400/20 ring-1 flex flex-col lg:flex-row ring-gray-900/5"
>
  {#if src}<img alt="header" {src} class="lg:rounded-l-lg max-w-xs" />{/if}
  <div class="px-4 py-5 sm:p-6 flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
    <div class="flex flex-col items-start gap-2">
      <h3 class="text-xl font-subtitle leading-6 flex-1 flex items-center gap-2">
        {#if scene.icon}<Icon icon={scene.icon} />{/if}<span class="relative top-0.5"
          >{scene.name}</span
        >
      </h3>
      <p>{scene.desc}</p>
    </div>
    {#if scene.gmnotes}
      <div
        class="mt-4 bg-purple-100 dark:bg-purple-950 border-3 p-2 prose dark:prose-invert prose-purple prose-blockquote:border-purple-600 dark:prose-blockquote:border-purple-400 prose-blockquote:bg-purple-200 dark:prose-blockquote:bg-purple-800 border-dashed rounded-lg border-purple-300 dark:border-purple-600"
      >
        {@html renderSafe(scene.gmnotes)}
      </div>
    {/if}
  </div>
  <div class="hidden absolute top-2 right-2 group-hover/scene:flex gap-3">
    <Button size="icon" icon="share" onclick={onshare} />
    <button
      type="button"
      onclick={onremove}
      class="text-lg rounded-full leading-none h-6 w-6 bg-purple-300 dark:bg-purple-900 flex items-center justify-center"
      ><span class="relative -top-px">&times;</span></button
    >
  </div>
</div>
