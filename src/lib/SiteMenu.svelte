<script lang="ts">
  import { DropdownMenu } from 'bits-ui';
  import Icon from './ui/icon.svelte';
  import { onMount } from 'svelte';
  import { getSettings } from '$lib/data/settings';

  const title = 'Menu';

  const settings = getSettings();

  let darkMode = $state(false);

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
      <DropdownMenu.Root>
        <DropdownMenu.Trigger>
          {#snippet child({ props })}
            <button
              {...props}
              type="button"
              {title}
              class="relative inline-flex items-center rounded-full shadow-lg dark:shadow-purple-400/20 bg-purple-300 dark:bg-purple-700 p-2 font-medium hover:bg-purple-200 dark:hover:bg-purple-800 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-900"
            >
              <Icon icon="bars" />
            </button>
          {/snippet}
        </DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Content
            sideOffset={8}
            align="end"
            class="z-50 w-56 origin-top-right divide-y divide-gray-100 rounded-md bg-white dark:bg-black shadow-xl dark:shadow-purple-400/20 ring-1 ring-purple-500 ring-opacity-5 focus:outline-none"
          >
            <div class="px-1 py-1">
              <DropdownMenu.Item
                onSelect={toggleMode}
                textValue="Switch color mode"
                class="group flex gap-2 rounded-md items-center w-full px-2 py-2 text-sm text-gray-900 dark:text-white data-[highlighted]:bg-purple-500 data-[highlighted]:text-white"
              >
                <Icon icon={darkMode ? `sun` : `moon`} />
                Switch to {darkMode ? `light` : `dark`} mode
              </DropdownMenu.Item>
              <DropdownMenu.Item
                onSelect={toggleDesktop}
                textValue="Switch desktop mode"
                class="group flex gap-2 rounded-md items-center w-full px-2 py-2 text-sm text-gray-900 dark:text-white data-[highlighted]:bg-purple-500 data-[highlighted]:text-white"
              >
                <Icon icon={$settings.desktopMode ? `mobile` : `desktop`} />
                Switch to {$settings.desktopMode ? `mobile` : `desktop`} mode
              </DropdownMenu.Item>
            </div>
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
    </div>
  </div>
</div>
