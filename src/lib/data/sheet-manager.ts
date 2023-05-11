import { id } from "$lib/rolling/id";
import type { Character, CharacterSummary } from "$lib/types";
import type { Writable } from "svelte/store";
import { get } from 'svelte/store';
import { clear, getAll } from "./storage";
import { createIdbStore, del, filteredValues } from "./idb-store";
import { download } from "$lib/util/download";
import { createBroadcastStore } from "./broadcast-store";

const LIST_KEY = 'bw-sheet-list';
const SHEET_KEY_PREFIX = 'bw-sheet-';

function getEmptySheet() {
  const empty: Character = {
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
  };
  return empty;
}

const STATUSES = 'statuses';

function replaceSheet(key: string, value: unknown) {
  if (key === STATUSES) {
    const sval = value as Set<string>;
    return Array.from(sval.values());
  }
  return value;
}

function reviveSheet(key: string, value: unknown) {
  if (key === STATUSES) {
    if (Array.isArray(value)) {
      return new Set<string>(value);
    } else {
      return new Set<string>();
    }
  }
  return value;
}

export function deleteSheet(id: string, list?: Writable<CharacterSummary[] | undefined>) {
  clear(`${SHEET_KEY_PREFIX}${id}`);
  del(`${SHEET_KEY_PREFIX}${id}`);
  if (list) {
    list.update((current) => {
      console.log(`Update list (deleteSheet ${id}) current = `, current);
      if (!current) return current;
      return current.filter(x => x.id !== id);
    });
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
  };
}

const refreshSummaries = (char: Character) => (current: CharacterSummary[] | undefined) => {
  console.log('Update list (getSheet) current = ', current);
  if (!current) return current;
  const index = current.findIndex(x => x.id === char.id);
  if (index < 0) return current;
  return [...current.slice(0, index), extractSummary(char), ...current.slice(index + 1)];
};

export function newList() {
  const store = createBroadcastStore<CharacterSummary[] | undefined>(LIST_KEY, undefined);
  return store;
}

export function loadList(list: Writable<CharacterSummary[] | undefined>) {
  filteredValues<Character>(k => k.toString().startsWith(SHEET_KEY_PREFIX))
    .then(some => some.map(extractSummary))
    .then(sum => list.set(sum));
}

export function loadSheet(id: string, list?: Writable<CharacterSummary[] | undefined>) {
  const empty = getEmptySheet();
  empty.id = id;
  const sheet = createIdbStore<Character>(`${SHEET_KEY_PREFIX}${id}`, empty);
  if (list) {
    sheet.subscribe(char => {
      list.update(refreshSummaries(char));
    });
  }
  return sheet;
}

export function createSheet(char: Partial<Character>, list?: Writable<CharacterSummary[] | undefined>): [string, Writable<Character>] {
  const newId = id();
  if (list) {
    list.update((current) => {
      if (!current) return current;
      console.log('Update list (createSheet) current = ', current);
      return [...current, extractSummary(char)]
    });
  }
  const sheet = loadSheet(newId);
  sheet.update(c => ({...c, ...char}));
  return [newId, sheet];
}

export async function downloadSheet(id: string) {
  const sheet = loadSheet(id);
  const char = get(sheet);
  const payload = JSON.stringify(char, replaceSheet, 2);
  download(payload, `bwo-${char.name || 'Unnamed'}.json`);
}

export async function uploadSheet(json: string, list?: Writable<CharacterSummary[] | undefined>) {
  try {
    const parsed = JSON.parse(json, reviveSheet);
    if ('id' in parsed) {
      delete parsed.id;
    }
    if (!('name' in parsed) || !('grit' in parsed) || !('str' in parsed)) {
      // Fail quietly for now
      return;
    }
    const ok = confirm(`Import character named ${parsed.name || '?'}?`);
    if (ok) {
      createSheet(parsed, list);
    }
  } catch {
    // Fail quietly for now
  }
}

export async function tryMigrate() {
  const oldList = getAll<Character>(key => key.startsWith(SHEET_KEY_PREFIX) && key !== LIST_KEY);
  await Promise.all(oldList.map(char => {
    const id = char.id;
    const sheet = loadSheet(id);
    clear(`${SHEET_KEY_PREFIX}${id}`);
    return sheet.set(char);
  }));
  clear(LIST_KEY);
}
