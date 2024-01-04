
import { getContextStore } from "$lib/data/settings";
import { id } from "$lib/rolling/id";
import type { RemoteEmbedMessage } from "$lib/types";

export type Playlog = { ids: Set<string>; list: RemoteEmbedMessage[] };

const PLAYLOG_KEY = 'bw-player-log';
const GAMEID_KEY = 'bw-current-gameid';
export const getPlayLog = getContextStore<Playlog>(PLAYLOG_KEY, { ids: new Set(), list: [] });
export const getGameId = getContextStore<string>(GAMEID_KEY, '');

export function addToLog(mat: ReturnType<typeof getPlayLog>, item: Partial<RemoteEmbedMessage>) {
  const toadd = Object.assign({id: id(), name: '', type: 'embed', time: new Date() } as RemoteEmbedMessage, item);
  mat.update(log => log.ids.has(toadd.id) ? log : { ids: log.ids.add(toadd.id), list: [toadd, ...log.list] });
}

export function removeItem(mat: ReturnType<
  typeof getPlayLog>, item: RemoteEmbedMessage | string) {
  const id = typeof(item) === 'string' ? item : item.id;
  mat.update(log => (log.ids.delete(id), { ids: log.ids, list: log.list.filter(x => x.id !== id)}));
}

export function clearLog(mat: ReturnType<typeof getPlayLog>) {
  mat.set({ ids: new Set(), list: [] });
}

