<script>
	import '../app.postcss';
	import ModeSwitcher from '$lib/ModeSwitcher.svelte';
  import Credits from '$lib/Credits.svelte';
</script>
<slot />
<ModeSwitcher />
<Credits />