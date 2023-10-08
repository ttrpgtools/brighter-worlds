import { getContext, hasContext, setContext } from "svelte";
import { createIdbStore } from "./idb-store";
import type { AsyncWritable } from "./async-load-store";
import { EMPTY, type Identifiable } from "$lib/types";
import { id } from "$lib/rolling/id";
import { update } from "$lib/util/array";

const SETTINGS_KEY = 'bw-settings';

export interface Settings {
  [EMPTY]?: boolean;
  desktopMode: boolean;
}

const defaultSettings: Settings = {
  [EMPTY]: true,
  desktopMode: false,
};

interface StoreCollectionMethods<T extends Identifiable> {
  appendItem: (item: T) => void;
  updateItem: (item: T) => void;
  removeItem: (item: T | string) => void;
  clear: () => void;
}

function addCollectionMethods<T extends Identifiable>(store: AsyncWritable<T[]>) {
  Object.assign(store, {
    appendItem(item: T) {
      const newId = id();
      item.id = newId;
      store.update(list => [...list, item]);
    },
    
    updateItem(item: T) {
      store.update(list => update(list, item));
    },
    
    removeItem(item: T | string) {
      const id = typeof(item) === 'string' ? item : item.id;
      store.update(list => list.filter(x => x.id !== id));
    },
    
    clear() {
      store.set([]);
    }

  });
  return store as AsyncWritable<T[]> & StoreCollectionMethods<T>;
}

export function getContextStore<T>(key: string, def: T) {
  return function () {
    let store: AsyncWritable<T>;
    if (!hasContext(key)) {
      store = createIdbStore<T>(key, def);
      setContext(key, store);
    } else {
      store = getContext(key);
    }
    return store;
  }
}

export function getCollectionContextStore<T extends Identifiable>(key: string) {
  return function () {
    let store: AsyncWritable<T[]> & StoreCollectionMethods<T>;
    if (!hasContext(key)) {
      store = addCollectionMethods(createIdbStore<T[]>(key, []));
      setContext(key, store);
    } else {
      store = getContext(key);
    }
    return store;
  }
}

export const getSettings = getContextStore(SETTINGS_KEY, defaultSettings);
