import { writable, type Updater, type Writable } from "svelte/store";

export function createBroadcastStore<T>(channel: string, initialValue?: T): Writable<T> {
  const internal = writable<T>(initialValue);
  const chan = new BroadcastChannel(channel);
  console.log('[BS] created BS', channel);
  chan.onmessage = (ev: MessageEvent<T>) => { if (ev && ev.data) internal.set(ev.data); }
  if (initialValue !== undefined) {
    chan.postMessage(initialValue);
  }
  return {
    ...internal,
    async set(value: T) {
      console.log(`[BS] chan (${channel}) set value`, value);
      chan.postMessage(value);
      internal.set(value);
    },
    async update(updater: Updater<T>) {
      internal.update((value: T) => {
        const result = updater(value);
        console.log(`[BS] chan (${channel}) update value`, value, result);
        chan.postMessage(result);
        return result;
      });
    }
  }
};
