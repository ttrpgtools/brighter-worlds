import { getNpcInstance } from "$lib/data/encounter-manager";
import { getContextStore } from "$lib/data/settings";
import { id } from "$lib/rolling/id";
import type { Encounter, Entity, Item, NpcInstance, RollResult } from "$lib/types";

interface PMScene {
  id: string;
  type: 'scene';
  scene: Entity;
}

interface PMItem {
  id: string;
  type: 'item';
  item: Item
}

interface PMNpc {
  id: string;
  type: 'npc';
  npc: NpcInstance
}

interface PMRoll {
  id: string;
  type: 'roll';
  roll: RollResult;
}

export type PlaymatItem = PMScene | PMItem | PMNpc | PMRoll;

export type Playmat = PlaymatItem[];

const PLAYMAT_KEY = 'bw-playmat';
export const getPlaymat = getContextStore<Playmat>(PLAYMAT_KEY, []);

function add(mat: ReturnType<typeof getPlaymat>, item: PlaymatItem) {
  const newId = id();
  item.id = newId;
  mat.update(list => [...list, item]);
}

export function addNpc(mat: ReturnType<typeof getPlaymat>, npc: NpcInstance) {
  add(mat, {id: '', type: 'npc', npc});
}

export function addItem(mat: ReturnType<typeof getPlaymat>, item: Item) {
  add(mat, {id: '', type: 'item', item});
}

export function addScene(mat: ReturnType<typeof getPlaymat>, scene: Entity) {
  add(mat, {id: '', type: 'scene', scene});
}

export function addRoll(mat: ReturnType<typeof getPlaymat>, roll: RollResult) {
  add(mat, {id: '', type: 'roll', roll});
}

export function addEncounter(mat: ReturnType<typeof getPlaymat>, enc: Encounter) {
  addScene(mat, {...enc, icon: 'nav-encounter' });
  enc.npcs?.forEach(n => addNpc(mat, getNpcInstance(n)));
}

export function removeItem(mat: ReturnType<
  typeof getPlaymat>, item: PlaymatItem | string) {
  const id = typeof(item) === 'string' ? item : item.id;
  mat.update(list => list.filter(x => x.id !== id));
}

export function clearMat(mat: ReturnType<typeof getPlaymat>) {
  mat.set([]);
}
