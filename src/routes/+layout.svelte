<script>
	import '../app.postcss';
	import ModeSwitcher from '$lib/ModeSwitcher.svelte';
  import Footer from '$lib/Footer.svelte';
	import { page } from '$app/stores';
</script>
<slot />
{#if $page.data?.layout?.showFooter ?? true}
<Footer />
{/if}
<ModeSwitcher />