import { getContextStore } from "$lib/data/settings";
import { id } from "$lib/rolling/id";
import type { Item } from "$lib/types";

const RELICS_KEY = 'bw-gm-relics';
export const getRelics = getContextStore<Item[]>(RELICS_KEY, []);

export function addRelic(reliquary: ReturnType<typeof getRelics>, item: Item) {
  const newId = id();
  item.id = newId;
  reliquary.update(list => [...list, item]);
}

export function removeRelic(reliquary: ReturnType<typeof getRelics>, item: Item | string) {
  const id = typeof(item) === 'string' ? item : item.id;
  reliquary.update(list => list.filter(x => x.id !== id));
}

export function clearRelics(reliquary: ReturnType<typeof getRelics>) {
  reliquary.set([]);
}
