<script lang="ts">
  import DeleteButton from "$lib/DeleteButton.svelte";
  import Disclosable from "$lib/Disclosable.svelte";
  import Icon from "$lib/Icon.svelte";
  import MenuLink from "$lib/MenuLink.svelte";
  import GmLink from "./GmLink.svelte";
  import GmTools from "./GmTools.svelte";
  import NpcSheet from "./NpcSheet.svelte";
  import Scene from "./Scene.svelte";
  import { getPlaymat, clearMat, removeItem } from "./playmat";

  const mat = getPlaymat();

  let tools: GmTools;

  function npcRoll(name: string) {
    return (ev: CustomEvent) => tools.basicRoll(ev, name);
  }
</script>
<main class="flex flex-col min-h-screen min-h-[100svh]">
  <header class="shrink-0 bg-gray-300 dark:bg-gray-900">
    <div class="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
      <h1 class="font-title text-3xl text-center"><a href="https://brighterworldsrpg.com" class="text-purple-700 dark:text-purple-300">Brighter Worlds</a> GM&nbsp;Tools <GmTools bind:this={tools} /></h1>
      <div class="flex items-center gap-x-8">
        <MenuLink href="/" icon="logo-leaf">Home</MenuLink>
      </div>
    </div>
  </header>

  <!-- 3 column wrapper -->
  <div class="mx-auto w-full max-w-7xl grow lg:flex xl:px-2">
    <div class="shrink-0 border-b border-gray-200 dark:border-gray-600 px-4 py-6 sm:px-6 lg:w-96 lg:border-r lg:border-b-0 lg:pr-8 xl:pr-6">
      <!-- Left column area -->
      <div class="flex flex-row gap-1 border-b border-purple-700 dark:border-purple-300 mb-4">
        <GmLink href="/gm" icon="nav-rungame" title="Run Game"></GmLink>
        <GmLink href="/gm/scene" icon="nav-scenes" title="Scenes"></GmLink>
        <GmLink href="/gm/encounter" icon="nav-encounter" title="Encounters"></GmLink>
        <GmLink href="/gm/bestiary" icon="nav-bestiary" title="Bestiary"></GmLink>
        <GmLink href="/gm/table" icon="nav-tables" title="Tables"></GmLink>
        <GmLink href="/gm/reliquary" icon="nav-relics" title="Reliquary"></GmLink>
        <!-- <div class="flex gap-2 items-end flex-1">
          <a target="_blank" rel="noreferrer" href="https://ttrpg.tools" class="text-emerald-500 relative -top-px"><Icon icon="ttrpgtools" /></a>
          <a target="_blank" rel="noreferrer" href="https://ttrpg.tools" class="text-purple-700 dark:text-purple-300 no-underline hover:underline">TTRPG.tools</a>
        </div> -->
      </div>
      <slot></slot>
    </div>
    <!-- Left sidebar & main wrapper -->
    <div class="flex-1 xl:flex">
      <div class="px-4 py-6 sm:px-6 lg:pl-8 xl:flex-1 xl:pl-6 flex flex-col gap-4">
        <!-- Main area Logging? -->
        <div class="flex flex-row justify-between">
          <h3 class="font-subtitle text-2xl">The Play Mat</h3>
          {#if $mat.length}
          <DeleteButton on:confirm={() => clearMat(mat)} confirmText="Click again to clear mat"/>
          {/if}
        </div>
        {#each $mat as item}
          {#if item.type === 'scene'}
            <Scene scene={item.scene} on:remove={() => removeItem(mat, item)}/>
          {:else if item.type === 'npc'}
            <NpcSheet bind:npc={item.npc} on:confirm={() => removeItem(mat, item)} on:roll={npcRoll(item.npc.name)} on:damage={async () => { if (item.type === 'npc') { await tools.takeDamage(item.npc); item.npc = item.npc; } }} />
          {:else if item.type === 'item'}
            <Disclosable>
              <svelte:fragment slot="header">
                <h3 class="text-xl font-subtitle leading-6 flex-1 flex items-center gap-2"><Icon icon="nav-relics"/><span class="relative top-0.5">{item.item.name}</span></h3>
                <div class="ml-auto flex gap-3">
                  <DeleteButton on:confirm={() => removeItem(mat, item)} size="w-3 h-3"/>
                </div>
              </svelte:fragment>
              <div class="prose dark:prose-invert prose-purple">
                {@html item.item.desc}
              </div>
            </Disclosable>
          {:else if item.type === 'roll'}
            {@const diceStr = item.roll.dice.length ? ` (${item.roll.dice.map(s => `d${s}`).join(' | ')})` : ``}
            <div class="border border-gray-200 dark:border-gray-600 rounded-md p-3 relative group/roll">
              <span class="font-bold">{item.roll.result}</span> {diceStr}{item.roll.label ? ` — ` : ``}{item.roll.label}
              <button type="button" on:click={() => removeItem(mat, item)} class="hidden absolute top-2 right-2 text-lg rounded-full leading-none h-6 w-6 bg-purple-300 dark:bg-purple-900 group-hover/roll:flex items-center justify-center"><span class="relative -top-px">&times;</span></button>
            </div>
          {/if}
        {/each}
      </div>
    </div>
  </div>
</main>