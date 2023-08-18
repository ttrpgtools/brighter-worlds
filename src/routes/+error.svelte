<script>
  import { page } from '$app/stores';
  import HomeLink from '$lib/HomeLink.svelte';
  import MenuLink from '$lib/MenuLink.svelte';
</script>
<HomeLink />
<main class="p-4 sm:p-8 flex flex-col items-center gap-2">
  <h2 class="font-title text-4xl text-center">{$page.status}</h2>
  <div class="font-symbol text-6xl">A</div>
  <div class="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-6 mb-6 text-center">
    {$page.error?.message}
  </div>
  <MenuLink href="/" icon="logo-leaf">Home</MenuLink>
</main>
