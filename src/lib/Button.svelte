<script lang="ts">
  export let plain = false;
  export let disabled = false;
</script>
<button type="button" on:click {disabled} class="inline-flex items-center rounded-full border border-transparent {plain ? `bg-transparent` : (disabled ? `bg-gray-300 dark:bg-gray-700` : `bg-purple-300 dark:bg-purple-700 shadow-sm`)} font-medium {disabled ? `` : `hover:bg-purple-200 dark:hover:bg-purple-800`} disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 px-6 pt-2 pb-2.5 focus:ring-offset-white dark:focus:ring-offset-gray-900"><slot /></button>