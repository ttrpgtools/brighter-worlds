<script lang="ts">
  import { page } from '$app/state';
  import { resolve } from '$app/paths';
  import { onMount, type Snippet } from 'svelte';
  import Button from '$lib/ui/button.svelte';
  import { cn } from '$lib/util/tw';
  import { OLD_ORIGIN, ROOT_ORIGIN } from '$lib/data/sheet-transfer/protocol';

  let { children, class: className }: { children?: Snippet; class?: string } = $props();
  let oldSite = $derived(page.url.origin === OLD_ORIGIN);
  const dismissalKey = 'bw-migration-notice-dismissed';
  let visible = $state(false);

  onMount(() => {
    try {
      visible = localStorage.getItem(dismissalKey) !== 'true';
    } catch {
      visible = true;
    }
  });

  function dismiss() {
    visible = false;
    try {
      localStorage.setItem(dismissalKey, 'true');
    } catch {
      // Dismiss for this visit even when browser storage is unavailable.
    }
  }
</script>

{#if visible}
  <section
    class={cn(
      'w-full max-w-6xl rounded-2xl border border-purple-300 bg-purple-50 p-5 text-left dark:border-purple-700 dark:bg-purple-950/60',
      className,
    )}
    aria-label="Find and move existing characters"
  >
    <h2 class="font-subtitle text-2xl">
      {oldSite ? 'Bring your adventurers to brighterworlds.app' : 'Characters on the old site?'}
    </h2>
    <p class="mt-2 max-w-3xl text-base">
      {#if oldSite}
        You can keep using your sheets here, or copy them to brighterworlds.app without an account.
        Your original sheets and their recovery tools stay available on this site.
      {:else}
        Characters saved at dev.brighterworlds.app live in separate browser storage. Use the browser
        and profile you played in to copy them here, even if you already have characters here.
      {/if}
    </p>
    <div class="mt-4 flex flex-wrap items-center gap-4">
      {#if children && page.url.origin === ROOT_ORIGIN}
        {@render children()}
        <a class="text-base underline" href={resolve('/migrate')}
          >Other transfer and recovery options</a
        >
      {:else}
        <Button href={resolve('/migrate')}>
          {oldSite ? 'Copy or back up your characters' : 'Find sheets from the old site'}
        </Button>
      {/if}
      <Button variant="ghost" size="sm" class="sm:ml-auto" onclick={dismiss}>
        Don’t show this again
      </Button>
    </div>
  </section>
{/if}
