import { getCollectionContextStore } from "$lib/data/settings";
import type { NpcStats } from "$lib/types";

const NPCS_KEY = 'bw-gm-npcs';
export const getNpcs = getCollectionContextStore<NpcStats>(NPCS_KEY);
