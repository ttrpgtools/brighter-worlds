<script lang="ts">
  import { portal } from '$lib/util/portal';
  import { blur } from 'svelte/transition';
  interface Props {
    url: string;
    onclick: () => void;
  }

  let { url, onclick }: Props = $props();
</script>

<div class="relative z-10 contents" use:portal>
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <div
    role="none"
    class="fixed inset-0 bg-purple-500 bg-opacity-20"
    {onclick}
    transition:blur
  ></div>

  <button type="button" {onclick} class="fixed inset-0 flex items-center justify-center">
    <img alt="Nope" src={url} class="max-h-full max-w-full" />
  </button>
</div>
