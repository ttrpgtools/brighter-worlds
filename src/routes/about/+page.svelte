<script lang="ts">
  import { Die } from "$lib/dice";
  import HomeLink from "$lib/HomeLink.svelte";
  import Icon from "$lib/Icon.svelte";
  import MenuLink from "$lib/MenuLink.svelte";
  import type { DieValue } from "$lib/types";
  const dice: DieValue[] = [4, 6, 8, 10, 12];
</script>
<svelte:head>
  <title>About :: Brighter Worlds Online</title>
</svelte:head>
<HomeLink />
<main class="p-8 flex flex-col items-center gap-2">
  <div class="flex flex-col md:flex-row gap-4 items-center">
    <div class="text-purple-500"><Icon icon="logo-leaf" size="2rem" /></div>
    <h2 class="font-title text-4xl text-center">About Brighter Worlds Online</h2>
  </div>
  <div class="font-symbol text-6xl">A</div>
  <div class="text-left mb-6 prose dark:prose-invert prose-a:text-purple-700 dark:prose-a:text-purple-300 prose-a:no-underline hover:prose-a:underline">
    <p>
      <a target="_blank" rel="noreferrer" href="https://brighterworldsrpg.com/">Brighter Worlds</a> is a tabletop role playing game (TTRPG) written by David Lombardo.
      There is a <a href="https://awkwardturtle.itch.io/brighter-worlds" target="_blank" rel="noreferrer">beautiful PDF available for purchase,</a> go buy it if you like the game.
    </p>
    <p>
      <strong>Brighter Worlds Online</strong> is an independent production by <a href="https://ttrpg.tools" target="_blank" rel="noreferrer">Colin Bate (TTRPG.tools)</a> and is not affiliated with AwkwardTurtle Games or David Lombardo. It is published under the Brighter Worlds Third Party License. Brighter Worlds is copyright AwkwardTurtle Games and David Lombardo.
    </p>
    <p>
      There is text used from the Brighter Worlds SRD, and that content is used under the CC-BY-SA 4.0 license. Any of the base callings, spells, rituals, equipment and creature desciptions fall under this license and are similarly licensed on this site. 
    </p>
    <div class="font-symbol text-4xl text-center text-purple-700 dark:text-purple-300">l</div>
    <p>
      Throughout the application we use icons to represent various dice that it is possible to roll. Sometimes these are labeled, other times they appear on their own. These are those icons in case you have issues with them. The number after the <strong>d</strong> is the number of sides on that die.
    </p>
    <div class="flex gap-6 sm:gap-8 justify-center p-4">
      {#each dice as die}
      <div class="flex flex-col gap-3 items-center">
        <Die which={die} size="h-8 w-8" />
        <span class="text-lg">d{die}</span>
      </div>
      {/each}
    </div>
    <div class="font-symbol text-4xl text-center text-purple-700 dark:text-purple-300">l</div>
    <p>
      The source code for this app is available on <a target="_blank" rel="noreferrer" href="https://github.com/ttrpgtools/brighter-worlds">GitHub</a>. If you encounter any issues, you can add them to <a target="_blank" rel="noreferrer"  href="https://github.com/ttrpgtools/brighter-worlds/issues">Issue Tracker</a>.
    </p>
  </div>
  <MenuLink href="/" icon="logo-leaf">Home</MenuLink>
</main>