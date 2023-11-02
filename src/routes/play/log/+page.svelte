<script lang="ts">
  import { onMount } from "svelte";
  import type { RemoteEmbedMessage, RemoteMessage } from "$lib/types";
  import { broadcast } from "$lib/data/channel-child";
  import { addToLog, clearLog, getGameId, getPlayLog, removeItem } from "./playlog";
  import DeleteButton from "$lib/DeleteButton.svelte";
  import Embed from "$lib/Embed.svelte";
  import Button from "$lib/Button.svelte";
  import { joinSession, type Session } from "$lib/data/p2p";
  import { fly } from "svelte/transition";
  import type { Readable } from "svelte/store";
  import { COLOR_NPC } from "$lib/const";
  import { distinctUntilChanged } from "$lib/util/distinctUntilChanged";

  let log = getPlayLog();
  let sesh: Session | undefined;
  let element: Element;
  let gameId = getGameId();
  let count: Readable<number>;

  onMount(() => {
    console.log('[LOG] Mounting');
    const unlisten = broadcast.subscribe(broadcastHandle);

    return () => {
      unlisten();
    };
  });

  async function broadcastHandle(msg: RemoteMessage) {
    console.log('[LOG] Handling broadcast message', msg);
    if (msg && msg.type === 'embed') {
      addToLog(log, msg);
      sesh?.send(msg);
    }
  }

  async function handleData(ev: Event) {
		const evt = ev as CustomEvent<{name: string; data: RemoteEmbedMessage;}>;
		console.log(evt);
    if (evt.detail && evt.detail.data) {
      addToLog(log, evt.detail.data);
    }
	}

  async function handleError(ev: Event) {
    const evt = ev as CustomEvent<Error>;
    if (evt.detail) {
      addToLog(log, {
        embed: {
          title: evt.detail.message.replaceAll('peer', 'game'),
          fields: [],
          color: COLOR_NPC,
        }
      });
    }
  }

  function connect() {
    if ($gameId === '') return;
    if (sesh) {
      if (count && $count > 0) {
        // Should disconnect
        sesh.disconnect();
        addToLog(log, {
        embed: {
          title: `Left game.`,
          fields: []
        }
      });
      } else {
        sesh.connect($gameId, '');
      }
    } else {
      sesh = joinSession($gameId, '');
      count = sesh.count;
      sesh.addEventListener('data', handleData);
      sesh.addEventListener('error', distinctUntilChanged(handleError, x => (x as CustomEvent<Error>)?.detail?.message));
    }
  }
  $: buttonText = count && $count > 0 ? 'Disconnect' : 'Connect';
</script>
<div bind:this={element} class="px-4 py-6 sm:px-6 lg:pl-8 xl:flex-1 xl:pl-6 flex flex-col gap-4 xl:basis-1/3 overflow-y-auto h-screen h-[100svh]">
  <div class="flex flex-row justify-between">
    <h3 class="font-subtitle text-2xl">The Game Log</h3>
    <div>
      {#if $log?.list?.length}
      <DeleteButton on:confirm={() => clearLog(log)} confirmText="Click again to clear log"/>
      {/if}
    </div>
  </div>
  <div class="flex gap-3 items-center">
    <input type="text" name="peerId" spellcheck="false" readonly={count && $count > 0} placeholder="Game Code (from GM)" bind:value={$gameId} class="rounded-full flex-1  dark:text-white focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-900 {count && $count > 0 ? `opacity-50` : ``}">
    <Button on:click={connect}>{buttonText}</Button>
  </div>
  {#each $log.list as msg (msg.id)}
    {@const dt = typeof msg.time === 'number' ? new Date(msg.time): msg.time }
    <div transition:fly={{ x: -50, duration: 200 }}>
      <Embed embed={msg.embed} name={msg.name} time={dt} on:delete={() => removeItem(log, msg)}/>
    </div>
  {/each}
</div>
