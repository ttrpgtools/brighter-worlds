import { callingManager } from "$lib/data/calling-manager";
import { enhancementManager } from "$lib/data/table-manager";
const callingList = callingManager.getHidden();
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async function() {
  return {
    companions: callingList,
    enhancements: enhancementManager.getById('rt-animal-companion'),
  };
}