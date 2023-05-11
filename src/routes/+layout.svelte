<script>
	import '../app.postcss';
	import ModeSwitcher from '$lib/ModeSwitcher.svelte';
  import Footer from '$lib/Footer.svelte';
	import { page } from '$app/stores';
  import { getEncounterStates, getTabManager } from '$lib/data/ui-state';

	getTabManager();
	getEncounterStates();

</script>
<slot />
{#if $page.data?.layout?.showFooter ?? true}
<Footer />
{/if}
<ModeSwitcher />