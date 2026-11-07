import { browser } from '$app/environment';
import { get as kvget, set as kvset } from 'idb-keyval';
import { getContext, hasContext, setContext } from 'svelte';
import { id } from '$lib/rolling/id';
import type { Identifiable } from '$lib/types';
import { snapshotState } from '$lib/util/snapshot.svelte';

export class PersistedCollection<T extends Identifiable> {
  items: T[] = $state([]);
  ready = $state(false);

  #loaded = false;

  constructor(
    private key: string,
    initial: T[] = [],
  ) {
    this.items = snapshotState(initial);

    if (browser) {
      kvget<T[]>(key).then((value) => {
        this.items = snapshotState(value ?? initial);
        this.#loaded = true;
        this.ready = true;
      });
    } else {
      this.#loaded = true;
      this.ready = true;
    }

    $effect(() => {
      const snapshot = snapshotState(this.items);
      if (browser && this.#loaded) {
        kvset(this.key, snapshot);
      }
    });
  }

  set(items: T[]) {
    this.items = snapshotState(items);
  }

  appendItem(item: T) {
    const next = snapshotState(item);
    next.id = next.id || id();
    this.items = [...this.items, next];
    return next;
  }

  updateItem(item: T) {
    this.items = this.items.map((current) =>
      current.id === item.id ? snapshotState(item) : current,
    );
  }

  removeItem(item: T | string) {
    const itemId = typeof item === 'string' ? item : item.id;
    this.items = this.items.filter((current) => current.id !== itemId);
  }

  clear() {
    this.items = [];
  }
}

export function getPersistedCollectionContext<T extends Identifiable>(key: string) {
  return function () {
    let collection: PersistedCollection<T>;
    if (!hasContext(key)) {
      collection = new PersistedCollection<T>(key);
      setContext(key, collection);
    } else {
      collection = getContext(key);
    }
    return collection;
  };
}
