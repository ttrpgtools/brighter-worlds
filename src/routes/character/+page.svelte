<script lang="ts">
  import { manager } from "$lib/data/sheet-manager";
  import MenuLink from "$lib/MenuLink.svelte";
  import Card from "$lib/Card.svelte";
  import { onMount } from "svelte";
  import { Die } from "$lib/dice/";
  import DeleteButton from "$lib/DeleteButton.svelte";
  import ButtonLink from "$lib/ButtonLink.svelte";

  const list = manager.list;
  onMount(() => {
    manager.loadList();
  });

  function deleteCharacter(id: string) {
    manager.deleteSheet(id);
  }
</script>
<svelte:head>
  <title>Your Characters :: Brighter Worlds Online</title>
</svelte:head>
<main class="p-8 flex flex-col items-center gap-2">
  <h2 class="font-title text-4xl text-center">Choose Your Adventurer</h2>
  <div class="font-symbol text-6xl">A</div>
  <div class="flex justify-center flex-wrap gap-4 mb-6 w-full max-w-screen-2xl">
    {#each $list as sheet (sheet.id)}
      <Card class="w-full sm:w-1/3 min-w-[22rem]">
        <div class="flex flex-col gap-4">
          <div class="flex justify-center text-4xl font-title">
            {sheet.name || '?'}
          </div>
          <div class="flex justify-center text-3xl font-subtitle">
            {sheet.calling || '?'}
          </div>
          <div class="flex gap-16 justify-center">
            <div class="relative">
              <span class="absolute font-black tracking-tighter text-3xl text-purple-200 dark:text-purple-800 left-1/2 -translate-x-1/2 top-1">STR</span>
              <span class="relative"><Die which={sheet.str} size="w-8 h-8"/></span>
            </div>
            <div class="relative">
              <span class="absolute font-black tracking-tighter text-3xl text-purple-200 dark:text-purple-800 left-1/2 -translate-x-1/2 top-1">DEX</span>
              <span class="relative"><Die which={sheet.dex} size="w-8 h-8"/></span>
            </div>
            <div class="relative">
              <span class="absolute font-black tracking-tighter text-3xl text-purple-200 dark:text-purple-800 left-1/2 -translate-x-1/2 top-1">WIL</span>
              <span class="relative"><Die which={sheet.wil} size="w-8 h-8"/></span>
            </div>
          </div>
          <div class="flex justify-between w-full">
            <ButtonLink href={`/character/${sheet.id}`}>View</ButtonLink>
            <DeleteButton on:confirm={() => deleteCharacter(sheet.id)}></DeleteButton>
          </div>
        </div>
      </Card>
    {:else}
      <div>No characters saved.</div>
    {/each}
  </div>
  <div class="font-symbol text-5xl">P</div>
  <MenuLink href="/character/new">Create A New Character</MenuLink>
  <MenuLink href="/">Home</MenuLink>
</main>