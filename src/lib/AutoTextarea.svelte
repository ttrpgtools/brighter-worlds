<script lang="ts">
	export let value = '';
	export let minRows = 1;
	export let maxRows: number;
	
	$: minHeight = `${1 + minRows * 1.25}em`;
	$: maxHeight = maxRows ? `${1 + maxRows * 1.25}em` : `auto`;
</script>

<div class="relative h-full">
	<pre class="-mx-2 p-2 leading-tight overflow-hidden border-transparent text-transparent"
		aria-hidden="true"
		style="min-height: {minHeight}; max-height: {maxHeight}"
	>{value + '\n'}</pre>

	<textarea bind:value class="absolute rounded-lg inset-0 bg-white dark:bg-gray-900 caret-purple-500 focus:ring-purple-500 focus:border-purple-500 resize-none leading-tight -mx-2 p-2"></textarea>	
</div>

<style>
	pre, textarea {
		font-family: inherit;
	}
</style>