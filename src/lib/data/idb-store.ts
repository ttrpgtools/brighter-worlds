import { writable, type Updater, type Writable } from "svelte/store";
import { createBroadcastStore } from "./broadcast-store";
import { get, set as kvset, del, entries } from 'idb-keyval';
import { createAsyncStore, type AsyncWritable } from "./async-load-store";
import { isEmpty, setEmpty } from "$lib/types";
export { del };
export interface LazyWritable<T> extends Writable<T> {
  load: () => Promise<boolean>;
  init: boolean;
}

export function createIdbStore<T>(dbKey: string, initialValue: T, crossTab = true): AsyncWritable<T> {
  if (typeof window === 'undefined' || !window.indexedDB) {
    return createAsyncStore<T>(writable(initialValue), Promise.resolve(initialValue));
  }
  const broadcastKey = `idb-data:${dbKey}`;
  const internal = crossTab ? createBroadcastStore<T>(broadcastKey, initialValue) : writable<T>(initialValue);

  const loaded = get<T>(dbKey).then(value => {
    if (value != null) {
      internal.set(value);
    } else if (initialValue != null) {
      kvset(dbKey, initialValue);
      if (isEmpty(initialValue) && setEmpty(initialValue, false)) {
        internal.set(initialValue);
      }
    }
  });

  async function set(value: T) {
    if (value == null || isEmpty(value)) {
      console.warn('setting empty', dbKey);
      return;
    }
    await loaded;
    kvset(dbKey, value);
    internal.set(value);
  }
  async function update(fn: Updater<T>) {
    await loaded;
    internal.update((value: T) => {
      const result = fn(value);
      if (result == null || isEmpty(result)) {
        console.warn('updating empty', dbKey);
        return value;
      }
      kvset(dbKey, result);
      return result;
    });
  }

  return {
    ...internal,
    set,
    update,
  }
}

export async function filteredValues<T>(fn: (key: IDBValidKey) => boolean): Promise<T[]> {
  if (typeof window === 'undefined' || !window.indexedDB) {
    return [];
  }    
  const all = await entries();
  const some = (all ?? []).filter(([key]) => fn(key)).map(([, val]) => val);
  return some;
}
