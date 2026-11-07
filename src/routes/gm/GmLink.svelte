<script lang="ts">
  import Icon from '$lib/ui/icon.svelte';
  import { page } from '$app/state';
  import { resolve } from '$app/paths';
  import type { Pathname } from '$app/types';
  interface Props {
    title?: string;
    href: Extract<Pathname, `/gm${string}`>;
    icon: string;
  }

  let { title = 'Tooltip', href, icon }: Props = $props();
</script>

<div class="relative min-w-0 flex-1 group">
  <a
    aria-label={title}
    {title}
    aria-current={page.url.pathname === resolve(href) ? 'page' : undefined}
    href={resolve(href)}
    class="font-subtitle text-2xl rounded-t-xl bg-purple-300 dark:bg-purple-700 aria-current:bg-purple-700 dark:aria-current:bg-purple-300 hover:bg-purple-200 dark:hover:bg-purple-800 hover:aria-current:bg-purple-800 dark:hover:aria-current:bg-purple-200 text-purple-900 dark:text-purple-100 aria-current:text-purple-100 dark:aria-current:text-purple-900 px-3 pb-2 pt-2.5 flex items-center gap-2 justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-inset"
  >
    <Icon {icon} class="w-5 h-5 relative -top-0.5" />
  </a>
  <span
    class="helper pointer-events-none absolute opacity-0 invisible group-hover:visible group-hover:opacity-100 group-hover:delay-500 group-focus-within:visible group-focus-within:opacity-100 transition-opacity text-center z-10 bg-gray-200 dark:bg-black border-0 rounded text-sm top-1/2 left-0 translate-y-full px-2 py-1 w-max"
  >
    <span
      class="nib absolute z-10 w-0 h-0 top-0 left-4 border-x-8 border-b-8 border-t-0 border-x-transparent border-t-transparent border-b-gray-200 dark:border-b-black translate-y-[-90%]"
    ></span>
    {title}
  </span>
</div>
