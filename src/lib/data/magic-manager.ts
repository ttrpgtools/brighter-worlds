import spells from '$data/spells.json';
import rituals from '$data/rituals.json';
import type { Magic, Ritual, Spell, UsableEntity } from '../types';
import { JsonDataManager } from './base-manager';

const spellList: Spell[] = (spells as UsableEntity[]).map(x => ({...x, type: 'spell'}));
const ritualList: Ritual[] = (rituals as UsableEntity[]).map(x => ({...x, type: 'ritual'}));

class MagicManager<T extends Magic> extends JsonDataManager<T> {

}

export const spellManager = new MagicManager(spellList);
export const ritualManager = new MagicManager(ritualList);
