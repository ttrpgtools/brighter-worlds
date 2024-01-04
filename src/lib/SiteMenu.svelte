<script lang="ts">
  import { createMenu } from 'svelte-headlessui';
  import Icon from './Icon.svelte';
  import { onMount } from 'svelte';
  import { scale } from 'svelte/transition';
  import { getSettings } from '$lib/data/settings';

  const title = 'Menu';

  const settings = getSettings();
  const menu = createMenu({ label: 'Actions' })

  let darkMode = false;
  
  onMount(() => {
    darkMode = document.documentElement.classList.contains('dark');
  });

  function toggleMode() {
    darkMode = !document.documentElement.classList.contains('dark');
    document.documentElement.classList.toggle('dark', darkMode);
    window.localStorage.setItem('dark-mode', darkMode ? 'dark' : 'light');
  }

  function toggleDesktop() {
    $settings.desktopMode = !$settings.desktopMode;
  }
  
</script>

<div class="flex w-full flex-col items-center justify-center">
  <div class="relative text-right">
    <div class="relative inline-block text-left">
      <button use:menu.button type="button" {title} on:click class="relative inline-flex items-center rounded-full shadow-lg dark:shadow-purple-400/20 bg-purple-300 dark:bg-purple-700 p-2 font-medium hover:bg-purple-200 dark:hover:bg-purple-800 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-900"><Icon icon="bars" /></button>
      {#if $menu.expanded}
        <div
          use:menu.items
          transition:scale={{start: 0.8}}
          class="absolute right-0 mt-2 w-56 origin-top-right divide-y divide-gray-100 rounded-md bg-white dark:bg-black shadow-xl dark:shadow-purple-400/20 ring-1 ring-purple-500 ring-opacity-5 focus:outline-none"
        >
          <div class="px-1 py-1">
              <button
                on:click={toggleMode}
                use:menu.item={{value: 'dark'}}
                class="group flex gap-2 rounded-md items-center w-full px-2 py-2 text-sm {$menu.active === 'dark' ? 'bg-purple-500 text-white' : 'text-gray-900 dark:text-white'}"
              >
                <Icon icon={darkMode ? `sun` : `moon`} />
                Switch to {darkMode ? `light` : `dark`} mode
              </button>
              <button
                on:click={toggleDesktop}
                use:menu.item={{value: 'desktop'}}
                class="group flex gap-2 rounded-md items-center w-full px-2 py-2 text-sm {$menu.active === 'desktop' ? 'bg-purple-500 text-white' : 'text-gray-900 dark:text-white'}"
              >
                <Icon icon={$settings.desktopMode ? `mobile` : `desktop`} />
                Switch to {$settings.desktopMode ? `mobile` : `desktop`} mode
              </button>
          </div>
        </div>
      {/if}
    </div>
  </div>
</div>