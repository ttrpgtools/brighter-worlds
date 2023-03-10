import { npcManager } from '$lib/data/npc-manager';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async function() {
  return {
    npcs: npcManager.getAll(),
  };
}

export const prerender = true;
