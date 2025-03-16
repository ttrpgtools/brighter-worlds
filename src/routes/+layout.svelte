<script lang="ts">
  import '../app.postcss';
  import Footer from '$lib/Footer.svelte';
  import { page } from '$app/state';
  import { getEncounterStates, getTabManager } from '$lib/data/ui-state';
  import SiteMenu from '$lib/SiteMenu.svelte';
  import { getSettings } from '$lib/data/settings';
  interface Props {
    children?: import('svelte').Snippet;
  }

  let { children }: Props = $props();

  getTabManager();
  getEncounterStates();
  getSettings();
</script>

{@render children?.()}
{#if page.data?.layout?.showFooter ?? true}
  <Footer />
{/if}
{#if page.data?.layout?.showMenu ?? true}
  <div class="absolute top-2 right-2">
    <SiteMenu />
  </div>
{/if}
