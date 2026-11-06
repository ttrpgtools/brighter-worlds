<script>
  import Footer from '$lib/Footer.svelte';
  import MenuLink from '$lib/MenuLink.svelte';
  import MigrationNotice from '$lib/MigrationNotice.svelte';
</script>

<svelte:head>
  <title>Brighter Worlds Online</title>
</svelte:head>
<main class="p-8 flex flex-col items-center justify-center gap-6 min-h-svh">
  <h1 class="font-title text-6xl text-center">
    <a href="https://brighterworldsrpg.com" class="text-purple-700 dark:text-purple-300"
      >Brighter Worlds</a
    > Online
  </h1>
  <div class="font-symbol text-6xl">A</div>
  <p class="max-w-xl text-center">
    Create an adventurer, keep your character sheets, and bring your world to the table. Play
    locally in your browser or choose optional account saving.
  </p>
  <div class="flex flex-col gap-2">
    <MenuLink href="/character/new" icon="nav-new-char">New Character</MenuLink>
    <MenuLink href="/character" icon="nav-characters">Characters</MenuLink>
    <MenuLink href="/arcana" icon="nav-arcana">Magna Arcana</MenuLink>
    <MenuLink href="/gm" icon="nav-gm">GM Tools</MenuLink>
    <MenuLink href="/about" icon="nav-about">About</MenuLink>
  </div>
  <MigrationNotice class="max-w-2xl" />
  <div class="pt-6">
    <Footer></Footer>
  </div>
</main>
