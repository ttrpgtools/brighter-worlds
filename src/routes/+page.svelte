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
  <div class="font-subtitle text-center text-2xl p-4 caution shadow-xl dark:shadow-purple-400/20 rotate-6 translate-y-4">
    <div class="bg-white dark:bg-gray-900 p-2">
      <div>Caution</div>
      <div>Work in progress</div>
      <div>
        v0.1.19
      </div>
    </div>
  </div>
</main>
<style>
  .caution {
    background-image: linear-gradient(45deg, #facc15 25%, #171717 25%, #171717 50%, #facc15 50%, #facc15 75%, #171717 75%, #171717 100%);
    background-size: 70.71px 70.71px;
  }
</style>