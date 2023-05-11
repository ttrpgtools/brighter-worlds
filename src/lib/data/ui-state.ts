import { createIdbStore } from "./idb-store";
import { clear } from "./storage";
import { browser } from "$app/environment";

if (browser) {
  clear('bw-tab-manager'); // Remove legacy keys.
}
export const UIKEYS = {
  tabManager: 'bw-tab-manager',
  encounterStates: 'bw-encounter-toggles',
};

export const getTabManager = () => createIdbStore<Record<string, number>>(UIKEYS.tabManager, {});

export const getEncounterStates = () => createIdbStore<Record<string, boolean>>(UIKEYS.encounterStates, {});
