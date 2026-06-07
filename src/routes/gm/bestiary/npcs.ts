import { getPersistedCollectionContext } from '$lib/data/persisted-collection.svelte';
import type { NpcStats } from '$lib/types';

const NPCS_KEY = 'bw-gm-npcs';
export const getNpcs = getPersistedCollectionContext<NpcStats>(NPCS_KEY);
