import { getPersistedCollectionContext } from '$lib/data/persisted-collection.svelte';
import type { Item } from '$lib/types';

const RELICS_KEY = 'bw-gm-relics';
export const getRelics = getPersistedCollectionContext<Item>(RELICS_KEY);
