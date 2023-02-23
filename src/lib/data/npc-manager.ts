import bestiary from '$data/bestiary.json';
import type { NpcStats } from '$lib/types';
import { JsonDataManager } from './base-manager';

class NpcManager extends JsonDataManager<NpcStats> {

}

export const npcManager = new NpcManager(bestiary as NpcStats[]);
