<script lang="ts">
  import { manager } from "$lib/data/sheet-manager";
  import MenuLink from "$lib/MenuLink.svelte";
  import ConfirmButton from "$lib/ConfirmButton.svelte";
  import Card from "$lib/Card.svelte";
  import { onMount } from "svelte";
  import { Die } from "$lib/dice/";

  const list = manager.list;
  onMount(() => {
    manager.loadList();
  });

  function deleteCharacter(id: string) {
    alert('Delete ' + id);
  }
</script>
<svelte:head>
  <title>Your Characters :: Brighter Worlds Online</title>
</svelte:head>
<main class="p-8 flex flex-col items-center gap-2">
  <h2 class="font-title text-4xl text-center">Choose Your Adventurer</h2>
  <div class="font-symbol text-6xl">A</div>
  <div class="flex justify-center flex-wrap gap-4 mb-6 w-full">
    {#each $list as sheet}
      <Card class="w-1/3">
        <div class="flex flex-col gap-4">
          <div class="flex justify-center text-4xl font-title">
            {sheet.name || '?'}
          </div>
          <div class="flex justify-center text-2xl font-subtitle">
            {sheet.calling || '?'}
          </div>
          <div class="flex gap-4 justify-center">
            <Die which={8} />
            <Die which={6} />
            <Die which={4} />
          </div>
          <div class="flex justify-between w-full">
            <a href={`/character/${sheet.id}`} class="inline-flex items-center rounded-full border border-transparent bg-purple-300 dark:bg-purple-700 px-4 py-2 text-xs font-medium shadow-sm hover:bg-purple-200 dark:hover:bg-purple-800 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-900">View</a>

            <ConfirmButton on:confirm={() => deleteCharacter(sheet.id)}><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" class="w-4 h-4"><path fill="currentColor" d="M144 400C144 408.8 136.8 416 128 416C119.2 416 112 408.8 112 400V176C112 167.2 119.2 160 128 160C136.8 160 144 167.2 144 176V400zM240 400C240 408.8 232.8 416 224 416C215.2 416 208 408.8 208 400V176C208 167.2 215.2 160 224 160C232.8 160 240 167.2 240 176V400zM336 400C336 408.8 328.8 416 320 416C311.2 416 304 408.8 304 400V176C304 167.2 311.2 160 320 160C328.8 160 336 167.2 336 176V400zM310.1 22.56L336.9 64H432C440.8 64 448 71.16 448 80C448 88.84 440.8 96 432 96H416V432C416 476.2 380.2 512 336 512H112C67.82 512 32 476.2 32 432V96H16C7.164 96 0 88.84 0 80C0 71.16 7.164 64 16 64H111.1L137 22.56C145.8 8.526 161.2 0 177.7 0H270.3C286.8 0 302.2 8.526 310.1 22.56V22.56zM148.9 64H299.1L283.8 39.52C280.9 34.84 275.8 32 270.3 32H177.7C172.2 32 167.1 34.84 164.2 39.52L148.9 64zM64 432C64 458.5 85.49 480 112 480H336C362.5 480 384 458.5 384 432V96H64V432z"/></svg></ConfirmButton>
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