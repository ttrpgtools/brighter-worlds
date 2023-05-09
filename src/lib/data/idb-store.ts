import { writable, type Updater, type Writable } from "svelte/store";
import { createBroadcastStore } from "./broadcast-store";
import { get, set as kvset, del } from 'idb-keyval';
export { del };
export interface LazyWritable<T> extends Writable<T> {
  load: () => Promise<boolean>;
  init: boolean;
}
export function createIdbStore<T>(dbKey: string, initialValue: T, crossTab = true): LazyWritable<T> {
  const broadcastKey = `idb-data:${dbKey}`;
  const internal = crossTab ? createBroadcastStore<T>(broadcastKey, initialValue) : writable<T>(initialValue);
  let init = false;
  async function load() {
    let ret = false;
    const value = await get<T>(dbKey);
    if (value != null) {
      internal.set(value);
      ret = true;
    } else if (initialValue !== undefined) {
      kvset(dbKey, initialValue);
    }
    init = true;
    return ret;
  }
  async function set(value: T) {
    if (!init) await load();
    kvset(dbKey, value);
    internal.set(value);
  }
  async function update(updater: Updater<T>) {
    if (!init) await load();
    internal.update((value: T) => {
      const result = updater(value);
      kvset(dbKey, result);
      return result;
    });
  }

  return {
    ...internal,
    set,
    update,
    load,
    get init() {
      return init;
    },
  }
}
