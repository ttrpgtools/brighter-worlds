<script lang="ts">
export let title = '';
export let inside = false;
let classProp: string | undefined = undefined;
export { classProp as class };
$: needHeader = !!title || $$slots.header;
</script>
<div class:divide-y={needHeader} class="relative divide-gray-200 dark:divide-gray-600 rounded-lg bg-white {inside ? `shadow-none` : `shadow-xl`} dark:bg-gray-900 dark:shadow-purple-400/20 ring-1 flex flex-col ring-gray-900/5 {classProp}">
  {#if needHeader}
  <div class="{inside ? `pb-5` : `px-4 py-5 sm:px-6`}">
    <div class="flex flex-wrap items-center justify-between sm:flex-nowrap">
      <slot name="header">
        <h3 class="text-xl font-subtitle leading-6 flex-1">{title}</h3>
      </slot>
    </div>
  </div>
  {/if}
  <div class="{inside ? `pt-5` : `px-4 py-5 sm:px-6`} flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
    <slot></slot>
  </div>
</div>