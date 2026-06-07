import { callingManager } from '$lib/data/calling-manager';
import { spellManager, ritualManager } from '$lib/data/magic-manager';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async function () {
  return {
    list: callingManager.getAll(),
    spells: spellManager.getAll(),
    rituals: ritualManager.getAll(),
  };
};
