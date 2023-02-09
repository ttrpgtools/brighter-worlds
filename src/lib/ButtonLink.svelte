<script lang="ts">
  export let plain = false;
  export let href: string;
</script>
<a {href} class="inline-flex items-center rounded-full border border-transparent {plain ? `bg-transparent` : `bg-purple-300 dark:bg-purple-700 shadow-sm`} font-medium  hover:bg-purple-200 dark:hover:bg-purple-800 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 px-6 pt-2 pb-2.5 focus:ring-offset-white dark:focus:ring-offset-gray-900"><slot /></a>