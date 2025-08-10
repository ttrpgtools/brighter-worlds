<script lang="ts">
  import Split from 'split.js';
  import { onMount } from 'svelte';
  import type { PageData } from './$types';
  import ModalImg from './ModalImg.svelte';
  onMount(() => {
    Split(['#logpanel', '#sheetpanel'], {
      sizes: [50, 50],
      gutterSize: 8
    });
    window.addEventListener('message', handleMessage);
  });

  let showImage = '';
  function handleMessage(evt: MessageEvent<{ type: string; data: string }>) {
    if (evt.data.type === 'showImage') {
      showImage = evt.data.data;
    }
  }
  function closeImg() {
    showImage = '';
  }
  export let data: PageData;
</script>

<div class="flex h-screen h-[100svh]">
  <div id="logpanel">
    <iframe src="/play/log/" title="Game log" id="logframe" class="h-full w-full"></iframe>
  </div>
  <div id="sheetpanel">
    <iframe src="/character/" title="Character Sheet" id="sheetframe" class="h-full w-full"
    ></iframe>
  </div>
</div>
{#if showImage}
  <ModalImg url={showImage} on:click={closeImg} />
{/if}

<style>
  :global(.gutter) {
    background-repeat: no-repeat;
    background-position: 50%;
    background-blend-mode: difference;
    background-image: url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAeCAYAAADkftS9AAAAIklEQVQoU2M4c+bMfxAGAgYYmwGrIIiDjrELjpo5aiZeMwF+yNnOs5KSvgAAAABJRU5ErkJggg==');
    cursor: col-resize;
  }
</style>
