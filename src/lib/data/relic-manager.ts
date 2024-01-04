import relics from '$data/relics.json';
import { renderSafe } from '$lib/md/render';
import type { Item } from '$lib/types';
import { JsonDataManager } from './base-manager';

const formatted = relics.map(x => ({...x, desc: renderSafe(x.desc)} as Item));

class RelicManager extends JsonDataManager<Item> {}

export const relicManager = new RelicManager(formatted);
