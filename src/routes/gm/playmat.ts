import { getNpcInstance } from "$lib/data/encounter-manager";
import { getContextStore } from "$lib/data/settings";
import { id } from "$lib/rolling/id";
import type { Encounter, Item, LogRoll, NpcInstance, RemoteEmbedMessage, RollResult, Scene } from "$lib/types";
import { update } from "$lib/util/array";

interface PMScene {
  id: string;
  type: 'scene';
  scene: Scene;
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



export type PlaymatItem = PMScene | PMItem | PMNpc;

export type Playmat = PlaymatItem[];

export type LogRollItem = LogRoll | RemoteEmbedMessage;

export type RollLog = { ids: Set<string>; list: LogRollItem[] };

const PLAYMAT_KEY = 'bw-playmat';
const ROLLLOG_KEY = 'bw-rolllog2';
export const getPlaymat = getContextStore<Playmat>(PLAYMAT_KEY, []);
export const getRollLog = getContextStore<RollLog>(ROLLLOG_KEY, {ids: new Set(), list: []});

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

export function addScene(mat: ReturnType<typeof getPlaymat>, scene: Scene) {
  add(mat, {id: '', type: 'scene', scene});
}

export function addEncounter(mat: ReturnType<typeof getPlaymat>, enc: Encounter) {
  addScene(mat, {...enc, icon: 'nav-encounter' });
  enc.npcs?.forEach(n => addNpc(mat, getNpcInstance(n)));
}

export function updateItem(mat: ReturnType<typeof getPlaymat>, item: PlaymatItem) {
  mat.update(list => update(list, item));
}

export function removeItem(mat: ReturnType<
  typeof getPlaymat>, item: PlaymatItem | string) {
  const id = typeof(item) === 'string' ? item : item.id;
  mat.update(list => list.filter(x => x.id !== id));
}

export function clearMat(mat: ReturnType<typeof getPlaymat>) {
  mat.set([]);
}

// --------------------------

function addRoll(mat: ReturnType<typeof getRollLog>, toadd: LogRollItem) {
  mat.update(log => log.ids.has(toadd.id) ? log : { ids: log.ids.add(toadd.id), list: [toadd, ...log.list] });
}

export function addLocalRoll(mat: ReturnType<typeof getRollLog>, roll: RollResult) {
  const toadd = {id: id(), name: '', type: 'roll', roll} as LogRoll;
  addRoll(mat, toadd);
}

export function addRemoteRoll(mat: ReturnType<typeof getRollLog>, item: Partial<RemoteEmbedMessage>) {
  const toadd = Object.assign({id: id(), name: '', type: 'embed', time: new Date() } as RemoteEmbedMessage, item);
  addRoll(mat, toadd);
}

export function removeRoll(mat: ReturnType<
  typeof getRollLog>, item: LogRollItem | string) {
  const id = typeof(item) === 'string' ? item : item.id;
  mat.update(log => (log.ids.delete(id), { ids: log.ids, list: log.list.filter(x => x.id !== id)}));
}

export function clearRollLog(mat: ReturnType<typeof getRollLog>) {
  mat.set({ids: new Set(), list: []});
}
