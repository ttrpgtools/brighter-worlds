import type { HandlerFn, RemoteMessage } from "$lib/types";

const INTERNAL_CHANNEL = 'bwo-channel';

let chan: BroadcastChannel;

function connect() {
  if (!chan) {
    chan = new BroadcastChannel(INTERNAL_CHANNEL);
    chan.onmessage = broadcastReceive;
  }
}

function broadcastReceive(ev: MessageEvent<RemoteMessage>) {
  if (ev && ev.data) {
    console.log('[BWO] Received broadcast data', ev.data);
    handlers.forEach(fn => fn(ev.data));
  }
}

const handlers = new Set<HandlerFn>();

export const broadcast = {
  send(msg: RemoteMessage) {
    connect();
    console.log('[BWO] Sending broadcast data', msg);
    chan.postMessage(msg);
  },
  addListener(fn: HandlerFn) {
    connect();
    handlers.add(fn);
    return () => handlers.delete(fn);
  }
};