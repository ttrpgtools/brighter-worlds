<script lang="ts">
  import { manager } from "$lib/data/sheet-manager";
  import MenuLink from "$lib/MenuLink.svelte";
  import Card from "$lib/Card.svelte";
  import { onMount } from "svelte";
  import { Die } from "$lib/dice/";
  import DeleteButton from "$lib/DeleteButton.svelte";
  import ButtonLink from "$lib/ButtonLink.svelte";
  import IconButton from "$lib/IconButton.svelte";
  import HomeLink from "$lib/HomeLink.svelte";
  import Icon from "$lib/Icon.svelte";

  const list = manager.list;
  onMount(() => {
    manager.loadList();
  });

  function deleteCharacter(id: string) {
    manager.deleteSheet(id);
  }

  let files: FileList;
  let uploader: HTMLInputElement;
  function startUpload() {
    if (uploader) uploader.click();
  }
  function handOff(ev: ProgressEvent<FileReader>) {
    const content = ev.target?.result;
    if (typeof content === 'string') {
      manager.upload(content);
    }
  }
  function gotFiles() {
    for (let fi = 0; fi < files.length; fi += 1) {
      const file = files[fi];
      if (file.type !== 'application/json') {
        continue;
      }
      const reader = new FileReader();
      reader.addEventListener('load', handOff, {once: true});
      reader.readAsText(file);
    }
  }
</script>
<svelte:head>
  <title>Your Characters :: Brighter Worlds Online</title>
</svelte:head>
<HomeLink />
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
            <div class="flex flex-row gap-4 items-center">
              <ButtonLink href={`/character/${sheet.id}`}>View</ButtonLink>
              <div>
                <IconButton icon="download" title="Download {sheet.name || '?'} (JSON)" on:click={() => manager.download(sheet.id)} />
              </div>
            </div>
            <DeleteButton on:confirm={() => deleteCharacter(sheet.id)}></DeleteButton>
          </div>
        </div>
      </Card>
    {:else}
      <div>No characters saved.</div>
    {/each}
  </div>
  <div class="font-symbol text-5xl">P</div>
  <div class="flex gap-4 items-center">
    <MenuLink href="/character/new" icon="nav-new-char">New Character</MenuLink>
    <div>
      <IconButton icon="upload" title="Upload character from JSON file" on:click={startUpload} />
      <input type="file" class="sr-only" bind:files bind:this={uploader} on:change={gotFiles} accept=".json">
    </div>
  </div>
  <MenuLink href="/" icon="logo-leaf">Home</MenuLink>
</main>