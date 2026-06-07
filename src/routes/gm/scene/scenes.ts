import { getPersistedCollectionContext } from '$lib/data/persisted-collection.svelte';
import type { Scene } from '$lib/types';

const SCENES_KEY = 'bw-gm-scenes';
export const getScenes = getPersistedCollectionContext<Scene>(SCENES_KEY);
