import { createIdbStore } from "./idb-store";
import { clear } from "./storage";
import { browser } from "$app/environment";
import { getContext, hasContext, setContext } from "svelte";
import type { AsyncWritable } from "./async-load-store";

if (browser) {
  clear('bw-tab-manager'); // Remove legacy keys.
}
const UIKEYS = {
  tabManager: 'bw-tab-manager',
  encounterStates: 'bw-encounter-toggles',
};

function createUiStore<T>(key: string, def: T) {
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

export const getTabManager = createUiStore<Record<string, number>>(UIKEYS.tabManager, {});

export const getEncounterStates = createUiStore<Record<string, boolean>>(UIKEYS.encounterStates, {});
