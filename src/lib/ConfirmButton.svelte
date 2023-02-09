<script lang="ts">
  import { fade } from 'svelte/transition'; 
  import ConfirmButtonLogic from './ConfirmButtonLogic.svelte';
  export let confirmText: string;
</script>
<ConfirmButtonLogic let:handleClick let:handleIn let:handleOut let:ready let:confirming on:confirm>
  <span class="relative inline-block">
    <button class:confirming type="button" on:mouseleave={handleOut} on:mouseenter={handleIn} on:click={handleClick} class="inline-flex items-center rounded-full border border-transparent bg-rose-300 dark:bg-rose-700 px-2.5 pt-2 pb-2.5 font-medium shadow-sm hover:bg-rose-200 dark:hover:bg-rose-800 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-900">
      <slot>Confirm</slot>
    </button>
    {#if ready}
    <span class="helper absolute text-center z-10 bg-rose-500 text-white border-0 rounded text-sm top-1/2 left-0 px-2 py-1 w-max" transition:fade={{duration: 175}}>
      <span class="nib absolute z-10 w-0 h-0 top-1/2 right-0 border-y-[0.5rem] border-l-[0.5rem] border-r-0 border-y-transparent border-r-transparent border-l-rose-500 -translate-y-1/2 translate-x-[90%] "></span>
      {confirmText}
    </span>
    {/if}
  </span>
</ConfirmButtonLogic>
<style>
  .confirming, .confirming:hover, .confirming:active {
    @apply text-white bg-rose-500;
  }
  .helper {
    transform: translate3d(calc(-100% + -1rem), -50%, 0);
  }
</style>
