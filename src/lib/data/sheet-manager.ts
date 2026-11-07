import { id } from '$lib/rolling/id';
import { type Character, type CharacterSummary, EMPTY } from '$lib/types';
import type { Updater, Writable } from 'svelte/store';
import { get } from 'svelte/store';
import {
  ensureSheetMigration,
  readLegacyFallback,
  tombstoneKey,
  storageFailure,
  reportRecoveryIssue,
} from './sheet-recovery';
import { normalizeLegacySheet } from './legacy-sheet';
import { transaction } from './storage-transaction';
import { createIdbStore, filteredEntries } from './idb-store';
import { createBroadcastStore } from './broadcast-store';
import { getContext, hasContext, setContext } from 'svelte';
import type { AsyncWritable } from './async-load-store';
import { sortByNumber } from '$lib/util/sort';

const LIST_KEY = 'bw-sheet-list';
const SHEET_KEY_PREFIX = 'bw-sheet-';
const SHEET_CACHE = 'bw-cache-sheets';

export function getEmptySheet() {
  const empty: Character = {
    [EMPTY]: true,
    id: '',
    name: '',
    pronouns: '',
    grit: { current: 3, max: 3 },
    str: { current: 4, max: 4 },
    dex: { current: 4, max: 4 },
    wil: { current: 4, max: 4 },
    statuses: new Set<string>(),
    equipment: [],
    calling: { id: '', name: '' },
    abilities: [],
    eulogy: [],
    spells: [],
    rituals: [],
    notes: '',
    created: 0,
    sortkey: 0,
  };
  return empty;
}

export async function deleteSheet(id: string, list?: Writable<CharacterSummary[] | undefined>) {
  try {
    await ensureSheetMigration();
    await transaction('readwrite', (store) => {
      store.put({ version: 1, deletedAt: Date.now() }, tombstoneKey(id));
      store.delete(`${SHEET_KEY_PREFIX}${id}`);
    });
    list?.update((current) => current?.filter((x) => x.id !== id));
  } catch (error) {
    storageFailure(error);
  }
}

function extractSummary(char: Partial<Character>): CharacterSummary {
  return {
    id: char?.id ?? '',
    name: char?.name ?? '',
    calling: char?.calling?.name ?? '',
    str: char?.str?.max ?? 4,
    dex: char?.dex?.max ?? 4,
    wil: char?.wil?.max ?? 4,
    created: char?.created ?? 1,
    sortkey: char?.sortkey ?? 1,
  };
}

function withSummaryUpdates(
  sheet: AsyncWritable<Character>,
  list: Writable<CharacterSummary[] | undefined>,
): AsyncWritable<Character> {
  sheet.loaded.then(() => {
    list.update(refreshSummaries(get(sheet)));
  });

  return {
    ...sheet,
    set(value: Character) {
      const operation = sheet.set(value).then(() => list.update(refreshSummaries(value)));
      void operation.catch(() => {});
      return operation;
    },
    update(updater: Updater<Character>) {
      const operation = sheet.update(updater).then(() => list.update(refreshSummaries(get(sheet))));
      void operation.catch(() => {});
      return operation;
    },
  };
}

const refreshSummaries = (char: Character) => (current: CharacterSummary[] | undefined) => {
  if (!current) return current;
  const index = current.findIndex((x) => x.id === char.id);
  if (index < 0) return current;
  return [...current.slice(0, index), extractSummary(char), ...current.slice(index + 1)];
};

export function getList() {
  let store: Writable<CharacterSummary[] | undefined>;
  if (!hasContext(LIST_KEY)) {
    store = createBroadcastStore<CharacterSummary[] | undefined>(LIST_KEY, undefined);
    setContext(LIST_KEY, store);
  } else {
    store = getContext(LIST_KEY);
  }
  return store;
}

export type SheetCache = Map<string, AsyncWritable<Character>>;

export async function loadList(
  list: Writable<CharacterSummary[] | undefined>,
  cache: SheetCache,
  status: Writable<string>,
) {
  status.set('Loading...');
  try {
    await tryMigrate(status, cache);
    const values = await filteredEntries<unknown>(
      (k) => typeof k === 'string' && k.startsWith(SHEET_KEY_PREFIX) && k !== LIST_KEY,
    );
    const summaries: CharacterSummary[] = [];
    for (const [key, value] of values) {
      try {
        summaries.push(
          extractSummary(
            normalizeLegacySheet(value, key.toString().slice(SHEET_KEY_PREFIX.length)),
          ),
        );
      } catch {
        reportRecoveryIssue({
          key: key.toString(),
          message: 'This saved record is damaged or has a mismatched ID. It was kept for recovery.',
        });
      }
    }
    summaries.sort(sortByNumber<CharacterSummary>('sortkey'));
    list.set(summaries);
  } catch (error) {
    storageFailure(error);
    list.set([]);
  } finally {
    status.set('');
  }
}

export function createSheetCache() {
  if (!hasContext(SHEET_CACHE)) {
    setContext(SHEET_CACHE, new Map<string, AsyncWritable<Character>>());
  }
}

export function getSheetCache() {
  return getContext<SheetCache>(SHEET_CACHE);
}

export function loadSheet(
  id: string,
  list?: Writable<CharacterSummary[] | undefined>,
  cache?: SheetCache,
) {
  if (cache && cache.has(id)) {
    const stored = cache.get(id);
    if (stored) return list ? withSummaryUpdates(stored, list) : stored;
  }
  const empty = getEmptySheet();
  empty.id = id;
  const sheet = createIdbStore<Character>(`${SHEET_KEY_PREFIX}${id}`, empty, true, {
    beforeLoad: ensureSheetMigration,
    decode: (value) => normalizeLegacySheet(value, id),
    fallback: () => readLegacyFallback(id),
  });
  if (cache) {
    cache.set(id, sheet);
  }
  return list ? withSummaryUpdates(sheet, list) : sheet;
}

export function createSheet(
  char: Partial<Character>,
  list?: Writable<CharacterSummary[] | undefined>,
  cache?: SheetCache,
): [string, Writable<Character>] {
  const newId = id();
  char.id = newId;
  if (list) {
    list.update((current) => {
      if (!current) return current;
      return [...current, extractSummary(char)];
    });
  }
  const sheet = loadSheet(newId, list, cache);
  sheet.update((c) => ({
    ...c,
    ...char,
    [EMPTY]: false,
    created: Date.now(),
    sortkey: Date.now(),
  }));
  return [newId, sheet];
}

export async function downloadSheet(id: string, cache?: SheetCache) {
  const { downloadCharacterBundle } = await import('./sheet-backup');
  return downloadCharacterBundle(id, cache);
}

export async function uploadSheet(json: string, list?: Writable<CharacterSummary[] | undefined>) {
  const { prepareBackup, restoreBackup } = await import('./sheet-backup');
  const prepared = await prepareBackup(json);
  if (
    !confirm(
      `Restore ${prepared.statuses.length} character(s)? Conflicting groups will be copied with new IDs.`,
    )
  )
    return;
  const result = await restoreBackup(prepared);
  if (list)
    await loadList(list, new Map(), {
      set() {},
      subscribe() {
        return () => {};
      },
      update() {},
    });
  return result;
}

export async function tryMigrate(status: Writable<string>, _cache?: SheetCache) {
  status.set('Checking saved characters...');
  return ensureSheetMigration();
}
