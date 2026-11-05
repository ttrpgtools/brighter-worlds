import { get as storeValue, writable, type Updater, type Writable } from 'svelte/store';
import { createBroadcastStore } from './broadcast-store';
import { get, set as kvset, del, entries } from 'idb-keyval';
import { createAsyncStore, type AsyncWritable } from './async-load-store';
import { isEmpty, setEmpty } from '$lib/types';
import { snapshotState } from '$lib/util/snapshot.svelte';
import { storageFailure, tombstoneKey, SHEET_PREFIX } from './sheet-recovery';
import { request, transaction } from './storage-transaction';
export { del };
export interface LazyWritable<T> extends Writable<T> {
  load: () => Promise<boolean>;
  init: boolean;
}

export function createIdbStore<T>(
  dbKey: string,
  initialValue: T,
  crossTab = true,
  options: {
    beforeLoad?: () => Promise<unknown>;
    decode?: (value: unknown) => T;
    fallback?: () => T | undefined;
  } = {},
): AsyncWritable<T> {
  if (typeof window === 'undefined') {
    return createAsyncStore<T>(writable(initialValue), Promise.resolve(initialValue));
  }
  const internal = crossTab
    ? createBroadcastStore<T>(`idb-data:${dbKey}`, initialValue)
    : writable<T>(initialValue);
  let available = false;
  let ready = false;
  const loaded = Promise.resolve()
    .then(async () => {
      await options.beforeLoad?.();
      if (!window.indexedDB) throw new Error('IndexedDB unavailable.');
      const value = await get<unknown>(dbKey);
      available = true;
      if (value != null) internal.set(options.decode ? options.decode(value) : (value as T));
      // Loading a missing key never writes a placeholder over recoverable data.
      else if (!options.decode && initialValue != null) setEmpty(initialValue, false);
    })
    .catch((error) => {
      available = false;
      const fallback = options.fallback?.();
      if (fallback !== undefined) internal.set(fallback);
      storageFailure(error);
    })
    .finally(() => {
      ready = true;
    });

  let queue = Promise.resolve();
  function enqueue(change: () => T, publish: boolean) {
    const operation = queue.then(async () => {
      await loaded;
      const next = change();
      if (next == null || isEmpty(next)) return;
      const snapshot = snapshotState(next);
      if (publish) internal.set(snapshot);
      if (!available) throw new Error('Browser storage is unavailable.');
      if (dbKey.startsWith(SHEET_PREFIX)) {
        await transaction('readwrite', async (store) => {
          if (await request(store.get(tombstoneKey(dbKey.slice(SHEET_PREFIX.length))))) {
            throw new Error('This character was deleted. Export unsaved changes before leaving.');
          }
          store.put(snapshot, dbKey);
        });
      } else await kvset(dbKey, snapshot);
    });
    queue = operation.catch(storageFailure);
    return operation;
  }
  return {
    subscribe: internal.subscribe,
    set(value: T) {
      const snapshot = snapshotState(value);
      const publish = !ready;
      if (ready && snapshot != null && !isEmpty(snapshot)) internal.set(snapshot);
      return enqueue(() => snapshot, publish);
    },
    update(fn: Updater<T>) {
      if (ready) {
        const snapshot = snapshotState(fn(storeValue(internal)));
        if (snapshot != null && !isEmpty(snapshot)) internal.set(snapshot);
        return enqueue(() => snapshot, false);
      }
      return enqueue(() => fn(storeValue(internal)), true);
    },
    loaded,
  };
}

export async function filteredEntries<T>(
  fn: (key: IDBValidKey) => boolean,
): Promise<[IDBValidKey, T][]> {
  if (typeof window === 'undefined' || !window.indexedDB) return [];
  return (await entries<IDBValidKey, T>()).filter(([key]) => fn(key));
}

export async function filteredValues<T>(fn: (key: IDBValidKey) => boolean): Promise<T[]> {
  return (await filteredEntries<T>(fn)).map(([, value]) => value);
}
