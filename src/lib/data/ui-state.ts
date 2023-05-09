import { createIdbStore } from "./idb-store";
import { clear } from "./storage";
import { browser } from "$app/environment";

if (browser) {
  clear('bw-tab-manager'); // Remove legacy keys.
}
export const tabManager = createIdbStore<Record<string, number>>('bw-tab-manager', {});

export const encounterStates = createIdbStore<Record<string, boolean>>('bw-encounter-toggles', {});
