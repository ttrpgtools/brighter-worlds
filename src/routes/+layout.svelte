<script>
	import '../app.postcss';
	import ModeSwitcher from '$lib/ModeSwitcher.svelte';
  import Footer from '$lib/Footer.svelte';
	import { page } from '$app/stores';
	import { setContext } from 'svelte';
  import { getEncounterStates, getTabManager, UIKEYS } from '$lib/data/ui-state';

	const tabManager = getTabManager();
	const encounterStates = getEncounterStates();
	setContext(UIKEYS.tabManager, tabManager);
	setContext(UIKEYS.encounterStates, encounterStates);

</script>
<slot />
{#if $page.data?.layout?.showFooter ?? true}
<Footer />
{/if}
<ModeSwitcher />