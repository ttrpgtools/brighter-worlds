<script lang="ts">
  export let value = false;
  function toggle() {
    value = !value;
  }
</script>
<button type="button" class="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:border-transparent focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 {value ? `bg-purple-500` : `bg-gray-200 dark:bg-gray-600`}" role="switch" aria-checked="false" on:click={toggle}>
  <span class="sr-only">Use setting</span>
  <span aria-hidden="true" class:translate-x-5={value} class:translate-x-0={!value} class="pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"></span>
</button>