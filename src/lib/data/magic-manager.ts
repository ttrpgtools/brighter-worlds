import spells from '$data/spells.json';
import rituals from '$data/rituals.json';
import type { UsableEntity } from '../types';
import { writable } from 'svelte/store';

const spellList = spells as UsableEntity[];
const ritualList = rituals as UsableEntity[];

class MagicManager {
  public spells = writable(spellList);
  public rituals = writable(ritualList);

  loadList() {
    // Intentionally empty
  }

}

export const magicManager = new MagicManager();
