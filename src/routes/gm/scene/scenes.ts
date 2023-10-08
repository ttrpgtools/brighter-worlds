import { getCollectionContextStore } from "$lib/data/settings";
import type { Entity } from "$lib/types";

const SCENES_KEY = 'bw-gm-scenes';
export const getScenes = getCollectionContextStore<Entity>(SCENES_KEY);
