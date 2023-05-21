import { getContext, hasContext, setContext } from "svelte";
import { createIdbStore } from "./idb-store";
import type { AsyncWritable } from "./async-load-store";
import { EMPTY } from "$lib/types";

const SETTINGS_KEY = 'bw-settings';

export interface Settings {
  [EMPTY]?: boolean;
  desktopMode: boolean;
}

const defaultSettings: Settings = {
  [EMPTY]: true,
  desktopMode: false,
};

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

export const getSettings = getContextStore(SETTINGS_KEY, defaultSettings);
