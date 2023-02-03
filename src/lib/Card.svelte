<script lang="ts">
export let title = '';
$: needHeader = !!title || $$slots.header;
</script>
<div class:divide-y={needHeader} class="relative divide-gray-200 dark:divide-gray-600 rounded-lg bg-white shadow-xl dark:bg-gray-900 dark:shadow-purple-400/20 ring-1 ring-gray-900/5">
  {#if needHeader}
  <div class="px-4 py-5 sm:px-6">
    <div class="-ml-4 -mt-4 flex flex-wrap items-center justify-between sm:flex-nowrap">
      <slot name="header">
        <div class="ml-4 mt-4">
          <h3 class="text-xl font-subtitle leading-6 flex-1">{title}</h3>
        </div>
      </slot>
    </div>
  </div>
  {/if}
  <div class="px-4 py-5 sm:p-6">
    <slot></slot>
  </div>
</div>