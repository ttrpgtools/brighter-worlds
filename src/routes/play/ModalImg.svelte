<script lang="ts">
  import { portal } from "$lib/util/portal";
  import { blur } from 'svelte/transition';
  export let url: string;
</script>
<div class="relative z-10 contents" use:portal>
    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <div role="none" class="fixed inset-0 bg-purple-500 bg-opacity-20" on:click transition:blur />

    <button type="button" on:click class="fixed inset-0 flex items-center justify-center">
      <img alt="Nope" src={url} class="max-h-full max-w-full">
    </button>
</div>