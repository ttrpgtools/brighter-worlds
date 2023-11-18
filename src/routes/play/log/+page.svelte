<script lang="ts">
  import { onMount } from "svelte";
  import type { Cta, RemoteEmbedMessage, RemoteMessage } from "$lib/types";
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
  import ModalImg from "../ModalImg.svelte";
  import { id } from "$lib/rolling/id";
  import DiceDialog from "$lib/DiceDialog.svelte";
  import { requestRollCall, rerequest } from "$lib/data/broadcast-hub";
  import { Formula } from "$lib/rolling/roll";
  import { formatRoll } from "$lib/util/share";
  import Icon from "$lib/Icon.svelte";

  let log = getPlayLog();
  let sesh: Session | undefined;
  let gameId = getGameId();
  let count: Readable<number>;
  let die: DiceDialog;
  let currentName: string | undefined;
  let activeChars: string[] | undefined;
  
  onMount(() => {
    console.log('[LOG] Mounting');
    const unlisten = broadcast.subscribe(broadcastHandle);
    const chars = requestRollCall();
    const unrollcall = chars.subscribe((v) => {
      console.log('[LOG] rc', v);
      activeChars = Array.from(v.entries()).map(([,{name}]) => name).filter(x => !!x);
      console.log('[LOG] active', activeChars);
      if (!currentName || !activeChars.includes(currentName)) {
        currentName = activeChars[0];
      }
    });
    return () => {
      unlisten();
      unrollcall();
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

  function callToAction(ev: CustomEvent<Cta>) {
    const cta = ev.detail;
    const f = new Formula(cta.formula);
    const value = f.roll();
    const roll = formatRoll(currentName ?? '', value, `Requested ${f.formula}`, f.dice);
    roll.meta = cta.meta;
    sesh?.send({id: id(), name: currentName ?? '', embed: roll, type: 'embed'});
    die.show(`${value}`, f.dice, f.formula);
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
        sesh.connect($gameId, currentName ?? '');
      }
    } else {
      sesh = joinSession($gameId, currentName ?? '');
      count = sesh.count;
      sesh.addEventListener('data', handleData);
      sesh.addEventListener('error', distinctUntilChanged(handleError, x => (x as CustomEvent<Error>)?.detail?.message));
    }
  }
  $: buttonText = count && $count > 0 ? 'Disconnect' : 'Connect';

  let showImage = '';
  function openImg(ev: CustomEvent<string>) {
    const url = ev.detail;
    if (window && window.parent && window.parent !== window) {
      // in iframe, ask parent to open image.
      window.parent.postMessage({ type: 'showImage', data: url });
    } else {
      // open it myself.
      showImage = url;
    }
  }

  function closeImg() {
    showImage = '';
  }
</script>
<DiceDialog bind:this={die} />
<div class="px-4 py-6 sm:px-6 flex flex-col gap-4 overflow-y-auto h-screen h-[100svh]">
  <div class=" flex flex-row justify-between items-center">
    <h3 class="text-2xl font-bold">Narrator</h3>
    <div class="flex gap-2 items-center">
      {#if activeChars && activeChars.length > 0}
      <svg xmlns="http://www.w3.org/2000/svg" height="1em" fill="currentColor" viewBox="0 0 448 512"><path d="M224 256A128 128 0 1 0 224 0a128 128 0 1 0 0 256zm-45.7 48C79.8 304 0 383.8 0 482.3C0 498.7 13.3 512 29.7 512H418.3c16.4 0 29.7-13.3 29.7-29.7C448 383.8 368.2 304 269.7 304H178.3z"/></svg>
        {#if activeChars.length === 1}
        {currentName}
        {:else if activeChars.length > 1}
        <select bind:value={currentName} class="rounded-md pl-2 py-1 border-orange-500 dark:bg-gray-900">
          {#each activeChars as char}
            <option value={char}>{char}</option>
          {/each}
        </select>
        {/if}
      {:else}
      <button type="button" on:click={() => rerequest()} class="rounded-md px-2 py-1 bg-orange-300 dark:bg-orange-700">Check Characters</button>
      {/if}
    </div>
    <div class=" min-w-[2rem]">
      {#if $log?.list?.length}
      <DeleteButton size="w-4 h-4" on:confirm={() => clearLog(log)} confirmText="Click again to clear log"/>
      {/if}
    </div>
  </div>
  <div class="flex gap-3 items-center">
    <input type="text" name="peerId" spellcheck="false" readonly={count && $count > 0} placeholder="Game Code (from GM)" bind:value={$gameId} class="rounded-md flex-1 px-2 py-1 dark:text-white focus:ring-orange-500 focus:border-orange-500 dark:bg-gray-900 {count && $count > 0 ? `opacity-50` : ``}">
    <button type="button" on:click={connect} class="rounded-md px-2 py-1 bg-orange-300 dark:bg-orange-700">{buttonText}</button>
  </div>
  {#each $log.list as msg (msg.id)}
    {@const dt = typeof msg.time === 'number' ? new Date(msg.time): msg.time }
    <div transition:fly={{ x: -50, duration: 200 }}>
      <Embed embed={msg.embed} name={msg.name} time={dt} on:delete={() => removeItem(log, msg)} on:imageclick={openImg} on:cta={callToAction}/>
    </div>
  {:else}
  <div class="text-gray-500 border-3 border-dashed rounded-lg p-4 border-gray-500 h-full flex flex-col gap-4 items-center justify-center text-center">
    <Icon icon="nav-arcana" size="2rem" />
    <p class="text-lg">Welcome adventurers, this is where your story unfolds.</p>
  </div>
  {/each}
</div>
{#if showImage}
<ModalImg url={showImage} on:click={closeImg} />
{/if}
