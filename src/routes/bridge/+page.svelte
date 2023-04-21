<script lang="ts">
  import { onMount } from "svelte";
  import type { RemoteMessage } from "$lib/types";
  import { broadcast } from "$lib/data/channel-child";

  let port2: MessagePort | undefined;

  onMount(() => {
    console.log('[Bridge] Mounting');
    window.addEventListener('message', initPort);
    const unlisten = broadcast.subscribe(broadcastHandle);
    if (window.parent && window.parent !== window) {
      window.parent.postMessage({type: 'init'}, '*');
    }

    return () => {
      unlisten();
      window.removeEventListener('message', initPort);
    };
  });

  function initPort(ev: MessageEventInit) {
    console.log('[Bridge] Receiving channel port as window data');
    port2 = ev.ports?.[0];
    if (port2) {
      port2.onmessage = channelReceive;
    }
  }

  function channelReceive(ev: MessageEvent<RemoteMessage>) {
    if (ev && ev.data) {
      broadcast.set(ev.data);
    }
  }

  function channelSend(msg: RemoteMessage) {
    if (port2) {
      console.log('[Bridge] Sending channel data', msg);
      port2.postMessage(msg);
    }
  }

  function broadcastHandle(msg: RemoteMessage) {
    console.log('[Bridge] Handling broadcast message', msg);
    channelSend(msg);
  }
</script>

<div>Bridge</div>
