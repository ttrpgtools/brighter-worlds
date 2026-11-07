<script lang="ts">
  import DeleteButton from '$lib/DeleteButton.svelte';
  import Embed from '$lib/Embed.svelte';
  import type { Cta, DieMod, DieValue, Entity, Item, NpcInstance } from '$lib/types';
  import { setGmContext } from '$lib/util/gm';
  import { snapshotState } from '$lib/util/snapshot.svelte';
  import { fly } from 'svelte/transition';
  import GmLink from './GmLink.svelte';
  import GmTools from './GmTools.svelte';
  import ItemBlock from './ItemBlock.svelte';
  import LocalRoll from './LocalRoll.svelte';
  import NpcSheet from './NpcSheet.svelte';
  import Scene from './Scene.svelte';
  import {
    getPlaymat,
    clearMat,
    removeItem,
    updateItem,
    getRollLog,
    removeRoll,
    clearRollLog,
    addPayload,
  } from './playmat';
  import { rollResponses } from './gmtools';
  import { onMount } from 'svelte';
  import { track } from '$lib/util/track';
  import { resolve } from '$app/paths';
  interface Props {
    children?: import('svelte').Snippet;
  }

  let { children }: Props = $props();

  setGmContext();
  const mat = getPlaymat();
  const log = getRollLog();

  let tools: GmTools | undefined = $state();

  onMount(() => {
    track('gm tools mounted');
  });

  function getNpcItem(itemId: string) {
    const item = mat.items.find((current) => current.id === itemId);
    return item?.type === 'npc' ? item : undefined;
  }

  function getItemItem(itemId: string) {
    const item = mat.items.find((current) => current.id === itemId);
    return item?.type === 'item' ? item : undefined;
  }

  function setNpcItem(itemId: string, npc: NpcInstance) {
    const item = getNpcItem(itemId);
    if (item) updateItem(mat, { ...item, npc });
  }

  function setItemItem(itemId: string, itemValue: Item) {
    const item = getItemItem(itemId);
    if (item) updateItem(mat, { ...item, item: itemValue });
  }

  function npcRoll(itemId: string) {
    return (data: { dice: DieValue[]; name: string }) => {
      const item = getNpcItem(itemId);
      tools?.basicRoll(data, item?.npc.name ?? 'NPC');
    };
  }
  function shareScene(scene: Entity) {
    return () => tools?.shareScene(scene);
  }
  function shareNpc(itemId: string) {
    return () => {
      const item = getNpcItem(itemId);
      if (item) tools?.shareNpc(item.npc);
    };
  }
  function sharePlaymatItem(itemId: string) {
    return () => {
      const item = getItemItem(itemId);
      if (item) tools?.shareItem(item.item);
    };
  }
  function callToAction(cta: Cta) {
    if (cta.type === 'roll') {
      const value = tools?.formulaRoll(cta.formula, `Requested ${cta.formula}`, 'GM');
      if (value && cta.meta) rollResponses.emit({ id: cta.meta, result: value });
    } else if (cta.type === 'addToMat') {
      for (const addable of cta.what) {
        addPayload(mat, addable);
      }
    }
  }
  function takeDamage(itemId: string) {
    return async (mod?: DieMod) => {
      const item = getNpcItem(itemId);
      if (!item) return;

      const npc = structuredClone(snapshotState(item.npc));
      await tools?.takeDamage(npc, mod);
      setNpcItem(itemId, npc);
    };
  }
</script>

<main class="flex flex-col min-h-svh lg:h-svh">
  <header class="shrink-0 bg-gray-300 dark:bg-gray-900">
    <div
      class="mx-auto flex min-h-16 items-center px-4 py-2 pr-28 sm:px-6 sm:pr-28 lg:px-8 lg:pr-28"
    >
      <h1 class="font-title text-xl sm:text-3xl min-w-0 flex flex-wrap gap-2 sm:gap-4 items-center">
        <a
          href={resolve('/')}
          aria-label="Brighter Worlds home"
          class="text-purple-700 dark:text-purple-300">Brighter Worlds</a
        >
        GM&nbsp;Tools <GmTools bind:this={tools} />
      </h1>
    </div>
  </header>

  <!-- 3 column wrapper -->
  <div class="mx-auto w-full min-h-0 grow lg:flex lg:h-[calc(100svh-4rem)]">
    <div
      class="min-h-0 shrink-0 flex flex-col border-b border-gray-200 dark:border-gray-600 lg:w-104 lg:border-r lg:border-b-0 lg:h-full"
    >
      <!-- Left column area -->
      <nav
        aria-label="GM tools"
        class="flex shrink-0 gap-1 border-b border-purple-700 dark:border-purple-300 px-4 pt-4 sm:px-6"
      >
        <GmLink href="/gm" icon="nav-rungame" title="Run Game"></GmLink>
        <GmLink href="/gm/scene" icon="nav-scenes" title="Scenes"></GmLink>
        <GmLink href="/gm/encounter" icon="nav-encounter" title="Encounters"></GmLink>
        <GmLink href="/gm/bestiary" icon="nav-bestiary" title="Bestiary"></GmLink>
        <GmLink href="/gm/table" icon="nav-tables" title="Tables"></GmLink>
        <GmLink href="/gm/reliquary" icon="nav-relics" title="Reliquary"></GmLink>
      </nav>
      <div class="min-h-0 flex-1 overflow-y-auto">
        <div class="px-4 py-4 sm:px-6">
          {@render children?.()}
        </div>
      </div>
    </div>
    <!-- Left sidebar & main wrapper -->
    <div class="flex-1 xl:flex lg:h-full">
      <div
        class="px-4 py-6 sm:px-6 lg:pl-8 xl:flex-1 xl:pl-6 flex flex-col gap-4 xl:basis-2/3 overflow-y-auto"
      >
        <!-- Main area Logging? -->
        <div class="flex flex-row justify-between">
          <button type="button" onclick={() => {}}
            ><h3 class="font-subtitle text-2xl">The Play Mat</h3></button
          >
          {#if mat.items.length}
            <DeleteButton
              label="Clear the Play Mat"
              onconfirm={() => clearMat(mat)}
              confirmText="Click again to clear mat"
            />
          {/if}
        </div>
        {#each mat.items as item (item.id)}
          {#if item.type === 'scene'}
            <Scene
              scene={item.scene}
              onremove={() => removeItem(mat, item)}
              onshare={shareScene(item.scene)}
            />
          {:else if item.type === 'npc'}
            <NpcSheet
              bind:npc={() => item.npc, (npc) => setNpcItem(item.id, npc)}
              ondelete={() => removeItem(mat, item)}
              onshare={shareNpc(item.id)}
              onroll={npcRoll(item.id)}
              ondamage={takeDamage(item.id)}
            />
          {:else if item.type === 'item'}
            <ItemBlock
              bind:item={() => item.item, (itemValue) => setItemItem(item.id, itemValue)}
              ondelete={() => removeItem(mat, item)}
              onshare={sharePlaymatItem(item.id)}
            />
          {/if}
        {/each}
      </div>
      <div
        class="px-4 py-6 sm:px-6 lg:pl-8 xl:flex-1 xl:pl-6 flex flex-col gap-4 xl:basis-1/3 overflow-y-auto"
      >
        <div class="flex flex-row justify-between">
          <h3 class="font-subtitle text-2xl">The Roll Log</h3>
          {#if $log.list.length}
            <DeleteButton
              label="Clear the Roll Log"
              onconfirm={() => clearRollLog(log)}
              confirmText="Click again to clear log"
            />
          {/if}
        </div>
        {#each $log.list as item (item.id)}
          {@const dt = typeof item.time === 'number' ? new Date(item.time) : item.time}
          <div transition:fly={{ x: 50, duration: 200 }}>
            {#if item.type === 'roll'}
              <LocalRoll {item} ondelete={() => removeRoll(log, item)} />
            {:else if item.type === 'embed'}
              <Embed
                embed={item.embed}
                name={item.name}
                time={dt}
                ondelete={() => removeRoll(log, item)}
                oncta={callToAction}
                showMeta
              />
            {/if}
          </div>
        {/each}
      </div>
    </div>
  </div>
</main>
