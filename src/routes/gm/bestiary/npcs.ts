import { getContextStore } from "$lib/data/settings";
import { id } from "$lib/rolling/id";
import type { NpcStats } from "$lib/types";

const NPCS_KEY = 'bw-gm-npcs';
export const getNpcs = getContextStore<NpcStats[]>(NPCS_KEY, []);

export function addNpc(bestiary: ReturnType<typeof getNpcs>, npc: NpcStats) {
  const newId = id();
  npc.id = newId;
  bestiary.update(list => [...list, npc]);
}

export function removeNpc(bestiary: ReturnType<typeof getNpcs>, item: NpcStats | string) {
  const id = typeof(item) === 'string' ? item : item.id;
  bestiary.update(list => list.filter(x => x.id !== id));
}

export function clearNpcs(bestiary: ReturnType<typeof getNpcs>) {
  bestiary.set([]);
}