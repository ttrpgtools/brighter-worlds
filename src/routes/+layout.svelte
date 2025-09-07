<script>
  import '../app.postcss';
  import Footer from '$lib/Footer.svelte';
  import { page } from '$app/stores';
  import { getEncounterStates, getTabManager } from '$lib/data/ui-state';
  import SiteMenu from '$lib/SiteMenu.svelte';
  import { getSettings } from '$lib/data/settings';
  import Bus from '$lib/bus/bus.svelte';

  getTabManager();
  getEncounterStates();
  getSettings();
</script>

<Bus src="https://magic-portal.divora.world" />
<slot />
{#if $page.data?.layout?.showFooter ?? true}
  <Footer />
{/if}
{#if $page.data?.layout?.showMenu ?? true}
  <div class="absolute top-2 right-2">
    <SiteMenu />
  </div>
{/if}
