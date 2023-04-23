<script lang="ts">
  import Icon from "./Icon.svelte";
</script>
<footer class="flex items-center justify-center gap-1 text-gray-500 dark:text-gray-300">
	<div class="flex items-center justify-center gap-2 border-gray-300 dark:border-gray-600 border-t p-5">
		<span>Crafted with</span>
		<span title="love" class="relative -top-px text-rose-500 dark:text-rose-300"><Icon icon="heart" /></span>
		<span>by</span>
		<a target="_blank" rel="noreferrer" href="https://ttrpg.tools" class="text-emerald-500 relative -top-px"><Icon icon="ttrpgtools" /></a>
		<a target="_blank" rel="noreferrer" href="https://ttrpg.tools" class="text-purple-700 dark:text-purple-300 no-underline hover:underline">TTRPG.tools</a>
	</div>
</footer>