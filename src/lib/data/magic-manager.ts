import spells from '$data/spells.json';
import rituals from '$data/rituals.json';
import type { Magic, Ritual, Spell, UsableEntity } from '../types';
import { writable } from 'svelte/store';

const spellList: Spell[] = (spells as UsableEntity[]).map(x => ({...x, type: 'spell'}));
const ritualList: Ritual[] = (rituals as UsableEntity[]).map(x => ({...x, type: 'ritual'}));

class MagicManager {
  public spells = writable(spellList);
  public rituals = writable(ritualList);

  loadList() {
    // Intentionally empty
  }

  getList<T extends Magic>(type: T["type"]) {
    return type === 'spell' ? this.spells : this.rituals;
  }

}

export const magicManager = new MagicManager();
