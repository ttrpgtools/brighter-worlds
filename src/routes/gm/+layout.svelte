<script lang="ts">
  import DeleteButton from "$lib/DeleteButton.svelte";
  import MenuLink from "$lib/MenuLink.svelte";
  import type { Entity, Item } from "$lib/types";
  import { setGmContext } from "$lib/util/gm";
  import GmLink from "./GmLink.svelte";
  import GmTools from "./GmTools.svelte";
  import ItemBlock from "./ItemBlock.svelte";
  import NpcSheet from "./NpcSheet.svelte";
  import Scene from "./Scene.svelte";
  import { getPlaymat, clearMat, removeItem, getRollLog, removeRoll, clearRollLog } from "./playmat";

  setGmContext();
  const mat = getPlaymat();
  const log = getRollLog();

  let tools: GmTools;

  function npcRoll(name: string) {
    return (ev: CustomEvent) => tools.basicRoll(ev, name);
  }
  function shareScene(scene: Entity) {
    return () => tools.shareScene(scene);
  }
  function shareNpc(npc: Entity) {
    return () => tools.shareNpc(npc);
  }
  function shareItem(item: Item) {
    return () => tools.shareItem(item);
  }
</script>
<main class="flex flex-col min-h-screen min-h-[100svh] lg:h-screen lg:h-[100svh]">
  <header class="shrink-0 bg-gray-300 dark:bg-gray-900">
    <div class="mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
      <h1 class="font-title text-3xl text-center"><a href="https://brighterworldsrpg.com" class="text-purple-700 dark:text-purple-300">Brighter Worlds</a> GM&nbsp;Tools <GmTools bind:this={tools} /></h1>
      <div class="flex items-center gap-x-8">
        <MenuLink href="/" icon="logo-leaf">Home</MenuLink>
      </div>
    </div>
  </header>

  <!-- 3 column wrapper -->
  <div class="mx-auto w-full grow lg:flex xl:px-2 lg:h-[calc(100svh-4rem)]">
    <div class="shrink-0 flex flex-col border-b border-gray-200 dark:border-gray-600 px-4 py-6 sm:px-6 lg:w-[26rem] lg:border-r lg:border-b-0 lg:pr-8 xl:pr-6 lg:h-full">
      <!-- Left column area -->
      <div class="flex flex-row gap-1 border-b border-purple-700 dark:border-purple-300">
        <GmLink href="/gm" icon="nav-rungame" title="Run Game"></GmLink>
        <GmLink href="/gm/scene" icon="nav-scenes" title="Scenes"></GmLink>
        <GmLink href="/gm/encounter" icon="nav-encounter" title="Encounters"></GmLink>
        <GmLink href="/gm/bestiary" icon="nav-bestiary" title="Bestiary"></GmLink>
        <GmLink href="/gm/table" icon="nav-tables" title="Tables"></GmLink>
        <GmLink href="/gm/reliquary" icon="nav-relics" title="Reliquary"></GmLink>
      </div>
      <div class="overflow-y-auto pt-4 lg:pr-3">
        <slot></slot>
      </div>
    </div>
    <!-- Left sidebar & main wrapper -->
    <div class="flex-1 xl:flex lg:h-full">
      <div class="px-4 py-6 sm:px-6 lg:pl-8 xl:flex-1 xl:pl-6 flex flex-col gap-4 xl:basis-2/3 overflow-y-auto">
        <!-- Main area Logging? -->
        <div class="flex flex-row justify-between">
          <h3 class="font-subtitle text-2xl">The Play Mat</h3>
          {#if $mat.length}
          <DeleteButton on:confirm={() => clearMat(mat)} confirmText="Click again to clear mat"/>
          {/if}
        </div>
        {#each $mat as item}
          {#if item.type === 'scene'}
            <Scene scene={item.scene} on:remove={() => removeItem(mat, item)} on:share={shareScene(item.scene)}/>
          {:else if item.type === 'npc'}
            <NpcSheet bind:npc={item.npc} on:confirm={() => removeItem(mat, item)} on:share={shareNpc(item.npc)} on:roll={npcRoll(item.npc.name)} on:damage={async () => { if (item.type === 'npc') { await tools.takeDamage(item.npc); item.npc = item.npc; } }} />
          {:else if item.type === 'item'}
            <ItemBlock item={item.item} on:confirm={() => removeItem(mat, item)} on:share={shareItem(item.item)} />
          {/if}
        {/each}
      </div>
      <div class="px-4 py-6 sm:px-6 lg:pl-8 xl:flex-1 xl:pl-6 flex flex-col gap-4 xl:basis-1/3 overflow-y-auto">
        <div class="flex flex-row justify-between">
          <h3 class="font-subtitle text-2xl">The Roll Log</h3>
          {#if $mat.length}
          <DeleteButton on:confirm={() => clearRollLog(log)} confirmText="Click again to clear log"/>
          {/if}
        </div>
        {#each $log as item}
          {#if item.type === 'roll'}
            {@const diceStr = item.roll.dice.length ? ` (${item.roll.dice.map(s => `d${s}`).join(' | ')})` : ``}
            <div class="border border-gray-200 dark:border-gray-600 rounded-md p-3 relative group/roll">
              <span class="font-bold">{item.roll.result}</span> {diceStr}{item.roll.label ? ` — ` : ``}{item.roll.label}
              <button type="button" on:click={() => removeRoll(log, item)} class="hidden absolute top-2 right-2 text-lg rounded-full leading-none h-6 w-6 bg-purple-300 dark:bg-purple-900 group-hover/roll:flex items-center justify-center"><span class="relative -top-px">&times;</span></button>
            </div>
          {/if}
        {/each}
      </div>
    </div>
  </div>
</main>