<script lang="ts">
  import { onMount } from "svelte";
  import type { RemoteEmbedMessage, RemoteMessage } from "$lib/types";
  import { broadcast } from "$lib/data/channel-child";
  import { addToLog, clearLog, getPlayLog, removeItem } from "./playlog";
  import DeleteButton from "$lib/DeleteButton.svelte";
  import Embed from "$lib/Embed.svelte";
  import Button from "$lib/Button.svelte";
  import { joinSession, type Session } from "$lib/data/p2p";
  import type { Readable } from "svelte/store";
  import { fly } from "svelte/transition";

  let log = getPlayLog();
  let peerId = '';
  let sesh: Session | undefined;
  let sid: Readable<string>;
  let element: Element;

  onMount(async () => {
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
	

  function connect() {
    if (peerId === '') return;
    sesh = joinSession(peerId, '');
    sid = sesh.id;
		sesh.addEventListener('data', handleData);
  }

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
    <input type="text" name="peerId" placeholder="Game Code (from GM)" bind:value={peerId} class="rounded-full flex-1  dark:text-white focus:ring-purple-500 focus:border-purple-500 {$sid ? `bg-green-200 dark:bg-green-800` : `dark:bg-gray-900`}">
    <Button on:click={connect}>Connect</Button>
  </div>
  {#each $log.list as msg (msg.id)}
    {@const dt = typeof msg.time === 'number' ? new Date(msg.time): msg.time }
    <div transition:fly={{ x: -50, duration: 200 }}>
      <Embed embed={msg.embed} name={msg.name} time={dt} on:delete={() => removeItem(log, msg)}/>
    </div>
  {/each}
</div>
