import { enhancementManager } from "$lib/data/table-manager";
const enhanceList = enhancementManager.getAll();
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async function() {
  return {
    list: enhanceList
  };
}