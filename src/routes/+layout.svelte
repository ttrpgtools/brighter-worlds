<script>
	import '../app.postcss';
	import ModeSwitcher from '$lib/ModeSwitcher.svelte';
  import Icon from '$lib/Icon.svelte';
</script>
<slot />
<footer class="flex items-center justify-center gap-1 text-gray-500 dark:text-gray-300">
	<div class="flex items-center justify-center gap-1 border-gray-300 dark:border-gray-600 border-t p-5">
		<span>Crafted with</span>
		<span title="love" class="relative -top-px"><Icon icon="heart" /></span>
		<span>by</span>
		<a target="_blank" rel="noreferrer" href="https://ttrpg.tools" class="text-emerald-500 relative -top-px"><Icon icon="ttrpgtools" /></a>
		<a target="_blank" rel="noreferrer" href="https://ttrpg.tools" class="text-purple-700 dark:text-purple-300 no-underline hover:underline">TTRPG.tools</a>
	</div>
</footer>
<ModeSwitcher />