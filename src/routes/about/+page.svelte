<script lang="ts">
  import MenuLink from "$lib/MenuLink.svelte";
</script>
<svelte:head>
  <title>About :: Brighter Worlds Online</title>
</svelte:head>
<main class="p-8 flex flex-col items-center gap-2">
  <h2 class="font-title text-4xl text-center">About Brighter Worlds Online</h2>
  <div class="font-symbol text-6xl">A</div>
  <div class="text-left mb-6 max-w-[66ch] prose dark:prose-invert">
    <p>
      <a target="_blank" rel="noreferrer" href="https://brighterworldsrpg.com/">Brighter Worlds</a> is a tabletop role playing game (TTRPG) written by David Lombardo.
      There is a <a href="https://awkwardturtle.itch.io/brighter-worlds" target="_blank" rel="noreferrer">beautiful PDF available for purchase,</a> go buy it if you like the game.
    </p>
    <p>
      <strong>Brighter Worlds Online</strong>, is created by <a href="https://colin.is" target="_blank" rel="noreferrer">Colin Bate</a>, and has no official connection to Brighter Worlds other than Colin being a fan and having David's approval. 
    </p>
    <p>
      There is text used from the Brighter Worlds SRD, and that content is used under the CC-BY-SA 4.0 license. Any of the base callings, spells, rituals, equipment and creature desciptions fall under this license and are similarly licensed on this site. 
    </p>
  </div>
  <MenuLink href="/">Home</MenuLink>
</main>
<style>
  a {
    @apply text-purple-500 no-underline hover:underline;
  }
</style>