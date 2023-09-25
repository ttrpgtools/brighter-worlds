<script lang="ts">
  export let title = 'Summary';
  export let open = false;
  export let gap = 'gap-4';
  export let addable = false;
  let classProp: string | undefined = undefined;
  export { classProp as class };
  </script>
  <details bind:open class="relative group/section flex flex-col {classProp}">
    <summary class="py-4 flex items-center gap-3 cursor-pointer border-b border-gray-200 dark:border-gray-600 group-open/section:mb-4">
      <svg xmlns="http://www.w3.org/2000/svg" class="-top-0.5 relative w-4 h-4 text-purple-500 transition duration-300 group-open/section:rotate-90" viewBox="0 0 512 512" fill="currentColor"><path d="M0 256a256 256 0 1 0 512 0A256 256 0 1 0 0 256zM240 128L368 256 240 384l-32 0 0-256 32 0z"/></svg>
      <h3 class="text-xl font-subtitle leading-6 flex-1">{title}</h3>
      {#if addable}
      <button type="button" on:click>
        <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-purple-500" viewBox="0 0 512 512" fill="currentColor"><path d="M288 32l0-32H224l0 32 0 192H32 0v64H32 224V480v32h64V480 288l192 0 32 0 0-64-32 0-192 0 0-192z"/></svg>
      </button>
      {/if}
    </summary>
    <div class="flex flex-col {gap}">
      <slot></slot>
    </div>
  </details>