<script lang="ts">
	export let value = '';
	export let minRows = 1;
	export let maxRows: number;
	export let id: string = '';
	
	$: minHeight = `${1 + minRows * 1.25}em`;
	$: maxHeight = maxRows ? `${1 + maxRows * 1.25}em` : `auto`;
</script>

<div class="relative h-full -mx-2 p-2 rounded-lg border border-gray-300 dark:border-gray-600 focus-within:ring-purple-500 focus-within:ring-2">
		<pre class="leading-tight overflow-hidden border-transparent text-transparent"
		aria-hidden="true"
		style="min-height: {minHeight}; max-height: {maxHeight}"
		>{value + '\n'}</pre>
		<textarea {id} bind:value class="absolute w-full h-full rounded-lg border-transparent left-0 top-0 bg-white focus:border-transparent focus:outline-none focus:ring-0 dark:bg-gray-900 caret-purple-500 resize-none leading-tight"></textarea>	
</div>

<style>
	pre, textarea {
		font-family: inherit;
	}
</style>