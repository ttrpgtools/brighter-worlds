import { lazyFactory } from "./storage";


export const tabManager = lazyFactory<Record<string, number>>('bw-tab-manager', {});

export const encounterStates = lazyFactory<Record<string, boolean>>('bw-encounter-toggles', {});
