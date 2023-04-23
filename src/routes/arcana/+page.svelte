<script lang="ts">
  import HomeLink from "$lib/HomeLink.svelte";
import MenuLink from "$lib/MenuLink.svelte";
  import type { PageData } from "./$types";
  import Magic from "./Magic.svelte";
  export let data: PageData;
</script>
<svelte:head>
  <title>Magna Arcana :: Brighter Worlds Online</title>
</svelte:head>
<HomeLink />
<main class="p-8 flex flex-col items-center gap-2">
  <h2 class="font-title text-4xl text-center">The Magic of Brighter&nbsp;Worlds</h2>
  <div class="font-symbol text-6xl">A</div>
  <h3 class="font-subtitle text-3xl mb-4 text-purple-800 dark:text-purple-300">Spells</h3>
  <div class="max-w-prose mb-6">
    {#each data.spells as spell (spell.id)}
    <Magic magic={spell} />
    {/each}
  </div>
  <h3 class="font-subtitle text-3xl mb-4 text-purple-800 dark:text-purple-300">Rituals</h3>
  <div class="max-w-prose mb-6">
    {#each data.rituals as ritual (ritual.id)}
    <Magic magic={ritual} />
    {/each}
  </div>
  <MenuLink href="/" icon="logo-leaf">Home</MenuLink>
</main>