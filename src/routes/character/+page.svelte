<script lang="ts">
  import HomeLink from '$lib/HomeLink.svelte';
  import MenuLink from '$lib/MenuLink.svelte';
  import CharacterLibrary from '$lib/CharacterLibrary.svelte';
</script>

<svelte:head><title>Your Characters :: Brighter Worlds Online</title></svelte:head>
<HomeLink />
<main class="flex flex-col items-center gap-2 px-4 pb-8 pt-16 sm:px-8">
  <h2 class="text-center font-title text-4xl">Choose Your Adventurer</h2>
  <div class="mb-4 font-symbol text-6xl" aria-hidden="true">A</div>
  <CharacterLibrary />
  <MenuLink href="/" icon="logo-leaf">Home</MenuLink>
</main>
