<script lang="ts">
  import Icon from "$lib/Icon.svelte";
  import { page } from '$app/stores';
  export let title: string = 'Tooltip';
  export let href: string;
  export let icon: string;
  console.log($page.url.pathname);
</script>
<div class="relative inline-block group">
  <a aria-current={$page.url.pathname === href ? 'page': undefined} {href} class="font-subtitle text-2xl rounded-t-xl bg-purple-300 dark:bg-purple-700 aria-current:bg-purple-700 dark:aria-current:bg-purple-300 hover:bg-purple-200 dark:hover:bg-purple-800 hover:aria-current:bg-purple-800 dark:hover:aria-current:bg-purple-200 text-purple-900 dark:text-purple-100 aria-current:text-purple-100 dark:aria-current:text-purple-900 px-4 pb-2 pt-2.5 flex items-center gap-2 justify-start">
    <Icon {icon} size="" class="w-5 h-5 relative -top-0.5"/>
  </a>
  <span class="helper absolute opacity-0 invisible group-hover:visible group-hover:opacity-100 group-hover:delay-500 transition-opacity text-center z-10 bg-gray-200 dark:bg-black border-0 rounded text-sm top-1/2 left-0 translate-y-full px-2 py-1 w-max">
    <span class="nib absolute z-10 w-0 h-0 top-0 left-4 border-x-[0.5rem] border-b-[0.5rem] border-t-0 border-x-transparent border-t-transparent border-b-gray-200 dark:border-b-black -translate-y-[90%] "></span>
    {title}
  </span>
</div>