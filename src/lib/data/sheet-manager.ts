import { id } from "$lib/rolling/id";
import type { Character, CharacterSummary } from "$lib/types";
import type { Writable } from "svelte/store";
import { get } from 'svelte/store';
import { clear, getter } from "./storage";
import { createIdbStore, del, type LazyWritable } from "./idb-store";
import { download } from "$lib/util/download";

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

class Manager {
  public list = createIdbStore<CharacterSummary[]>(LIST_KEY, []);
  private oldList: CharacterSummary[] | null = null;
  private loaded = false;
  private sheetCache = new Map<string, LazyWritable<Character>>();

  async loadList() {
    await this.list.load();
    this.oldList = getter<CharacterSummary[]>(LIST_KEY);
    if (this.oldList != null) {
      await this.tryMigrate();
    }
    this.loaded = true;
  }

  async create(char: Partial<Character>, unlisted = false): Promise<[string, Writable<Character>]> {
    const newId = id();
    if (!this.loaded) {
      await this.loadList();
    }
    if (!unlisted) {
      this.list.update((current) => ([...current, {
        id: newId,
        name: char.name ?? '',
        calling: char.calling?.name ?? '',
        str: char.str?.max ?? 4,
        dex: char.dex?.max ?? 4,
        wil: char.wil?.max ?? 4,
      }]));
    }
    const sheet = this.getSheet(newId);
    sheet.load();
    sheet.update(c => ({...c, ...char}));
    return [newId, sheet];
  }

  deleteSheet(id: string) {
    clear(`${SHEET_KEY_PREFIX}${id}`);
    del(`${SHEET_KEY_PREFIX}${id}`);
    this.list.update((current) => current.filter(x => x.id !== id));
  }

  async tryMigrate() {

  }

  async download(id: string) {
    const sheet = this.getSheet(id);
    if (!sheet.init) await sheet.load();
    const char = get(sheet);
    const payload = JSON.stringify(char, replaceSheet, 2);
    download(payload, `bwo-${char.name || 'Unnamed'}.json`);
  }

  async upload(json: string) {
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
        await this.create(parsed);
      }
    } catch {
      // Fail quietly for now
    }
  }

  getSheet(id: string) {
    let sheet: LazyWritable<Character> | undefined = undefined;
    if (this.sheetCache.has(id)) {
      sheet = this.sheetCache.get(id);
    }
    if (sheet != null) {
      return sheet;
    }
    const empty = getEmptySheet();
    empty.id = id;
    sheet = createIdbStore<Character>(`${SHEET_KEY_PREFIX}${id}`, empty);
    sheet.subscribe(char => {
      this.list.update(current => {
        const index = current.findIndex(x => x.id === id);
        if (index < 0) return current;
        return [...current.slice(0, index), {...current[index], name: char.name, calling: char.calling?.name, str: char.str.max, dex: char.dex.max, wil: char.wil.max}, ...current.slice(index + 1)];
      });
    });
    this.sheetCache.set(id, sheet);
    return sheet;
  }
}

export const manager = new Manager();
