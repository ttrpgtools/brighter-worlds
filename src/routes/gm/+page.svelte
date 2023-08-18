<script>
  import MenuLink from "$lib/MenuLink.svelte";
</script>
<main class="p-8 flex flex-col items-center justify-center gap-2 min-h-screen min-h-[100svh]">
  <h1 class="font-title text-6xl text-center"><a href="https://brighterworldsrpg.com" class="text-purple-700 dark:text-purple-300">Brighter Worlds</a> GM&nbsp;Tools</h1>
  <div class="font-symbol text-6xl">A</div>
  <div class="flex flex-col gap-2">
    <MenuLink href="/gm/encounter" icon="nav-encounter">Encounters</MenuLink>
    <MenuLink href="/gm/bestiary" icon="nav-bestiary">Bestiary</MenuLink>
    <MenuLink href="/" icon="logo-leaf">Home</MenuLink>
  </div>
</main>