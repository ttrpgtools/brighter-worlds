import { callingManager } from "$lib/data/calling-manager";
const callingList = callingManager.getAll();
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async function() {
  return {
    list: callingList
  };
}
