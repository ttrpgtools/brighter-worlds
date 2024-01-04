import { getCollectionContextStore } from "$lib/data/settings";
import type { Item } from "$lib/types";

const RELICS_KEY = 'bw-gm-relics';
export const getRelics = getCollectionContextStore<Item>(RELICS_KEY);
