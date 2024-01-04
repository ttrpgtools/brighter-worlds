<script lang="ts">
  import Icon from "./Icon.svelte";
  export let href: string;
  export let icon = '';
</script>
<a {href} class="font-subtitle text-2xl rounded-full bg-purple-300 dark:bg-purple-700 hover:bg-purple-200 dark:hover:bg-purple-800 text-center text-purple-900 dark:text-purple-100 px-6 pb-2 pt-2.5 flex items-center gap-3 justify-center">
  {#if icon}<Icon {icon} size="" class="w-5 h-5 relative -top-0.5"/>{/if}
  <slot/>
</a>
