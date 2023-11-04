<script lang="ts">
export let title = 'Summary';
export let open = false;
export let overflowable = false;
export let imgsrc = '';
export let imgalt = '';
export let imgclass = 'lg:rounded-bl-lg max-w-xs';
export let short = false;
let classProp: string | undefined = undefined;
export { classProp as class };
</script>
<details bind:open class:divide-y={true} class="relative group divide-gray-200 dark:divide-gray-600 rounded-lg bg-white shadow-xl dark:bg-gray-900 dark:shadow-purple-400/20 ring-1 flex flex-col ring-gray-900/5 {classProp}">
  <summary class="px-4 {short ? `py-2` : `py-5`} sm:px-6 flex items-center gap-3 cursor-pointer before:transition before:duration-300 before:-top-0.5 before:relative group-open:before:rotate-90 before:w-0 before:h-0 before:border-t-[0.5rem] before:border-t-transparent before:border-l-[0.75rem] before:border-l-purple-500 before:border-b-[0.5rem] before:border-b-transparent">
    <slot name="header">
      <h3 class="text-xl font-subtitle leading-6 flex-1">{title}</h3>
    </slot>
  </summary>
  <div class="flex flex-col lg:flex-row">
    {#if imgsrc}<img src={imgsrc} alt={imgalt} class="{imgclass}">{/if}
    <div class="px-4 py-5 sm:p-6 flex flex-col flex-1 {overflowable ? `` : `overflow-y-auto overflow-x-hidden`}">
      <slot></slot>
    </div>
  </div>
</details>