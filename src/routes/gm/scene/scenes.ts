import { getCollectionContextStore } from "$lib/data/settings";
import type { Scene } from "$lib/types";

const SCENES_KEY = 'bw-gm-scenes';
export const getScenes = getCollectionContextStore<Scene>(SCENES_KEY);
