<script lang="ts">
  import Icon from "./Icon.svelte";
  export let icon: string;
  export let title = '';
  export let padding = 'p-2';
  export let size = '1rem';
</script>
<button type="button" {title} on:click class="relative inline-flex items-center rounded-full bg-purple-300 dark:bg-purple-700 {padding} font-medium shadow-sm hover:bg-purple-200 dark:hover:bg-purple-800 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-900"><Icon {icon} {size}/></button>