import { getNpcInstance } from '$lib/data/encounter-manager';
import { getPersistedCollectionContext } from '$lib/data/persisted-collection.svelte';
import { getContextStore } from '$lib/data/settings';
import { id } from '$lib/rolling/id';
import type {
  Encounter,
  Item,
  LogRoll,
  MatAddable,
  NpcInstance,
  RemoteEmbedMessage,
  RollResult,
  RolltableOption,
  Scene,
  TableRoll,
} from '$lib/types';
import { isEncounter, isNpc } from '$lib/util/validate';

interface PMScene {
  id: string;
  type: 'scene';
  scene: Scene;
}

interface PMItem {
  id: string;
  type: 'item';
  item: Item;
}

interface PMNpc {
  id: string;
  type: 'npc';
  npc: NpcInstance;
}

export type PlaymatItem = PMScene | PMItem | PMNpc;

export type Playmat = PlaymatItem[];

export type LogRollItem = LogRoll | RemoteEmbedMessage;

export type RollLog = { ids: Set<string>; list: LogRollItem[] };

const PLAYMAT_KEY = 'bw-playmat';
const ROLLLOG_KEY = 'bw-rolllog2';
export const getPlaymat = getPersistedCollectionContext<PlaymatItem>(PLAYMAT_KEY);
export const getRollLog = getContextStore<RollLog>(ROLLLOG_KEY, { ids: new Set(), list: [] });

function add(mat: ReturnType<typeof getPlaymat>, item: PlaymatItem) {
  mat.appendItem(item);
}

export function addNpc(mat: ReturnType<typeof getPlaymat>, npc: NpcInstance) {
  add(mat, { id: '', type: 'npc', npc });
}

export function addItem(mat: ReturnType<typeof getPlaymat>, item: Item) {
  add(mat, { id: '', type: 'item', item });
}

export function addScene(mat: ReturnType<typeof getPlaymat>, scene: Scene) {
  add(mat, { id: '', type: 'scene', scene });
}

export function addEncounter(mat: ReturnType<typeof getPlaymat>, enc: Encounter) {
  addScene(mat, { ...enc, icon: 'nav-encounter' });
  enc.npcs?.forEach((n) => addNpc(mat, getNpcInstance(n)));
}

export function addPayload(mat: ReturnType<typeof getPlaymat>, addable: MatAddable) {
  if (addable.kind === 'item') {
    addItem(mat, addable.payload);
  } else if (addable.kind === 'npc') {
    addNpc(mat, addable.payload);
  } else if (addable.kind === 'scene') {
    addScene(mat, addable.payload);
  }
}

export function getAddableFromTableRoll(
  roll: TableRoll<RolltableOption> | undefined,
): MatAddable | undefined {
  if (!roll?.value.length) return;
  const first = roll.value[0];
  if (first.type !== 'entity') return;
  const ent = first.value;
  if (isNpc(ent)) {
    return { kind: 'npc', payload: getNpcInstance(ent) } satisfies MatAddable;
  } else if (isEncounter(ent)) {
    const inst = { ...ent, id: id() };
    return { kind: 'encounter', payload: inst };
  } else {
    return { kind: 'item', payload: ent } satisfies MatAddable;
  }
}

export function updateItem(mat: ReturnType<typeof getPlaymat>, item: PlaymatItem) {
  mat.updateItem(item);
}

export function removeItem(mat: ReturnType<typeof getPlaymat>, item: PlaymatItem | string) {
  mat.removeItem(item);
}

export function clearMat(mat: ReturnType<typeof getPlaymat>) {
  mat.clear();
}

// --------------------------

function addRoll(mat: ReturnType<typeof getRollLog>, toadd: LogRollItem) {
  mat.update((log) =>
    log.ids.has(toadd.id) ? log : { ids: log.ids.add(toadd.id), list: [toadd, ...log.list] },
  );
}

export function addLocalRoll(mat: ReturnType<typeof getRollLog>, roll: RollResult) {
  const toadd = { id: id(), name: '', type: 'roll', roll } as LogRoll;
  addRoll(mat, toadd);
}

export function addRemoteRoll(
  mat: ReturnType<typeof getRollLog>,
  item: Partial<RemoteEmbedMessage>,
) {
  const toadd = Object.assign(
    { id: id(), name: '', type: 'embed', time: new Date() } as RemoteEmbedMessage,
    item,
  );
  addRoll(mat, toadd);
}

export function removeRoll(mat: ReturnType<typeof getRollLog>, item: LogRollItem | string) {
  const id = typeof item === 'string' ? item : item.id;
  mat.update(
    (log) => (log.ids.delete(id), { ids: log.ids, list: log.list.filter((x) => x.id !== id) }),
  );
}

export function clearRollLog(mat: ReturnType<typeof getRollLog>) {
  mat.set({ ids: new Set(), list: [] });
}
