import relics from '$data/relics.json';
import relicSets from '$data/relic-sets.json';
import { renderSafe } from '$lib/md/render';
import type { Item } from '$lib/types';
import { JsonDataManager } from './base-manager';

// Include collection rules in the ordinary description so they travel with shared items.
const formatted = relics.map((item) => {
  const set = relicSets.find((set) => set.items.includes(item.id));
  const desc = set ? `${item.desc}\n\n**${set.name}**\n\n${set.desc}` : item.desc;
  return { ...item, desc: renderSafe(desc) } as Item;
});

class RelicManager extends JsonDataManager<Item> {}

export const relicManager = new RelicManager(formatted);
