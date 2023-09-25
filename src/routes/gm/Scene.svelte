<script lang="ts">
  import type { Entity } from "$lib/types";

  export let scene: Entity;
  $: src = typeof(scene.image) === 'string' ? scene.image : '';
</script>

<div class="relative rounded-lg bg-white shadow-xl dark:bg-gray-900 dark:shadow-purple-400/20 ring-1 flex flex-col lg:flex-row ring-gray-900/5">
  <img alt="header" {src} class="lg:rounded-l-lg max-w-sm">
  <div class="px-4 py-5 sm:p-6 flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
    <div class="flex flex-col items-start gap-2">
      <h3 class="text-xl font-subtitle leading-6 flex-1">{scene.name}</h3>
      <p>{scene.desc}</p>
    </div>
  </div>
</div>