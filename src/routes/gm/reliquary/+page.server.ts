import { relicManager } from '$lib/data/relic-manager';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async function() {
  return {
    relics: relicManager.getAll(),
  };
}
