import { browser } from "$app/environment";
import { isEmpty } from "$lib/types";
import { writable, type Updater, type Writable } from "svelte/store";

export function createBroadcastStore<T>(channel: string, initialValue?: T): Writable<T> {
  const internal = writable<T>(initialValue);
  if (!browser) return internal;
  const chan = new BroadcastChannel(channel);
  chan.onmessage = (ev: MessageEvent<T>) => { if (ev && ev.data) internal.set(ev.data); }
  if (initialValue !== undefined && !isEmpty(initialValue)) {
    chan.postMessage(initialValue);
  }
  return {
    ...internal,
    async set(value: T) {
      chan.postMessage(value);
      internal.set(value);
    },
    async update(updater: Updater<T>) {
      internal.update((value: T) => {
        const result = updater(value);
        chan.postMessage(result);
        return result;
      });
    }
  }
};
