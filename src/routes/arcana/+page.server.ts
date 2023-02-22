import { spellManager, ritualManager } from '$lib/data/magic-manager';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async function() {
  return {
    spells: spellManager.getAll(),
    rituals: ritualManager.getAll(),
  };
}