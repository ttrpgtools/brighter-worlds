import bestiary from '$data/bestiary.json';
import type { NpcStats } from '$lib/types';
import { JsonDataManager } from './base-manager';

class NpcManager extends JsonDataManager<NpcStats> {
  getDefault() {
    return {
      id: 'beast-default',
      name: 'Untitled',
      grit: 3,
      str: 6,
      dex: 6,
      wil: 6,
      armor: 0,
      attacks: [
        {
          id: 'beastattack-default',
          name: 'Weapon',
          damage: 6
        }
      ],
      notes: [],
      found: 'Anywhere',
      wants: 'Something'
    } as NpcStats;
  }
}

export const npcManager = new NpcManager(bestiary as NpcStats[]);
