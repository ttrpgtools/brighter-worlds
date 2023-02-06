<script>
  import MenuLink from "$lib/MenuLink.svelte";
</script>
<svelte:head>
  <title>Brighter Worlds Online</title>
</svelte:head>
<main class="p-8 flex flex-col items-center justify-center gap-2 min-h-screen min-h-[100svh]">
  <h2 class="font-title text-4xl text-center">Welcome to</h2>
  <h1 class="font-title text-6xl text-center"><a href="https://brighterworldsrpg.com" class="text-purple-700 dark:text-purple-300">Brighter Worlds</a> Online</h1>
  <div class="font-symbol text-6xl">A</div>
  <MenuLink href="/character/new">Create A Character</MenuLink>
  <MenuLink href="/character">Characters</MenuLink>
  <MenuLink href="/bestiary">Bestiary</MenuLink>
  <MenuLink href="/reliquary">Reliquary</MenuLink>
  <MenuLink href="/arcana">Magna Arcana</MenuLink>
  <MenuLink href="/academy">Dream Academy</MenuLink>
</main>
