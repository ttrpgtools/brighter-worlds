import callings from '$data/callings.json';
import type { Calling } from '../types';
import { id } from '$lib/rolling/id';
import { renderSafe } from '$lib/md/render';
import { JsonDataManager } from './base-manager';

const callingList = callings.map(c => ({
  ...c,
  desc: renderSafe(c.desc),
  abilities: c.abilities.map(a => ({...a, desc: renderSafe(a.desc)})),
  equipment: c.equipment.map(e => ({...e, id: id()})),
})) as Calling[];

class CallingManager extends JsonDataManager<Calling> {
  getAll() {
    return Array.from(this.table.values()).filter(x => !x.hidden);
  }
  getHidden() {
    return Array.from(this.table.values()).filter(x => x.hidden);
  }
}

export const callingManager = new CallingManager(callingList);
