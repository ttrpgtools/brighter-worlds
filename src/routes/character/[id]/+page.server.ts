import { callingManager } from "$lib/data/calling-manager";
const callingList = callingManager.getAll();
import { enhancementManager } from "$lib/data/table-manager";
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async function({ params }) {
  return {
    id: params.id,
    callings: callingList,
    enhancements: enhancementManager.getAll(),
  };
}
