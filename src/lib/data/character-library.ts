import type { DieValue, CharacterSummary } from '$lib/types';
import type { AccountRecord } from './account-persistence';
import type { AegisListPage } from '$lib/server/aegis';
import { accountHref } from './account-client';
export type CharacterFilter = 'all' | 'local' | 'account';
export interface CharacterEntry {
  key: string;
  id: string;
  name: string;
  calling: string;
  storage: 'local' | 'account';
  href: string;
  str?: DieValue;
  dex?: DieValue;
  wil?: DieValue;
  status: string;
  attention: boolean;
  cached?: boolean;
}
export function characterEntries(
  local: CharacterSummary[],
  owner: string,
  items: AegisListPage['items'],
  records: AccountRecord[],
): CharacterEntry[] {
  const result: CharacterEntry[] = local.map((sheet) => ({
    ...sheet,
    key: `local:${sheet.id}`,
    storage: 'local',
    href: `/character/${encodeURIComponent(sheet.id)}`,
    status: 'Stored in this browser',
    attention: false,
  }));
  if (!owner) return result;
  const ids = new Set([...items.map((item) => item.docId), ...records.map((record) => record.id)]);
  for (const id of ids) {
    const row = records.find((record) => record.id === id);
    const item = items.find((item) => item.docId === id);
    const dirty = !!row && (!!row.pending || row.revision !== row.savedRevision);
    const status =
      row?.deleted || row?.error?.code === 'not_found'
        ? 'Deleted online; draft kept'
        : row?.conflict
          ? 'Conflicting online changes'
          : row?.error
            ? row.error.message
            : dirty
              ? 'Changes waiting to save online'
              : 'Account sheet';
    result.push({
      key: `account:${owner}:${id}`,
      id,
      storage: 'account',
      href: accountHref(owner, id),
      name: row?.character.name ?? item?.meta?.name ?? '',
      calling: row?.character.calling.name ?? item?.meta?.calling ?? '',
      str: row?.character.str.max,
      dex: row?.character.dex.max,
      wil: row?.character.wil.max,
      status,
      attention: !!(row?.deleted || row?.error || row?.conflict || dirty),
      cached: !!row,
    });
  }
  return result;
}
export function filterCharacters(entries: CharacterEntry[], filter: CharacterFilter) {
  return filter === 'all' ? entries : entries.filter((entry) => entry.storage === filter);
}
