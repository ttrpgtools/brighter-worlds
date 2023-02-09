import { id } from "$lib/rolling/id";
import type { Calling, Character, CharacterSummary } from "$lib/types";
import type { Writable } from "svelte/store";
import { clear, lazyFactory, type LazyWritable } from "./storage";

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
  public list = lazyFactory<CharacterSummary[]>(LIST_KEY, []);
  private loaded = false;
  private sheetCache = new Map<string, LazyWritable<Character>>();

  loadList() {
    this.list.load();
    this.loaded = true;
  }

  create(name: string, calling: Calling): [string, Writable<Character>]{
    const newId = id();
    if (!this.loaded) {
      this.loadList();
    }
    this.list.update((current) => ([...current, { id: newId, name, calling: calling.name, str: 4, dex: 4, wil: 4 }]));
    const sheet = this.getSheet(newId);
    sheet.load();
    // TODO load more of the calling.
    sheet.update((current) => ({...current, name, calling: { id: calling.id, name: calling.name, desc: calling.tagline }}));
    return [newId, sheet];
  }

  deleteSheet(id: string) {
    clear(`${SHEET_KEY_PREFIX}${id}`);
    this.list.update((current) => current.filter(x => x.id !== id));
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
    sheet = lazyFactory<Character>(`${SHEET_KEY_PREFIX}${id}`, empty, { replacer: replaceSheet, reviver: reviveSheet });
    sheet.subscribe(char => {
      this.list.update(current => {
        const index = current.findIndex(x => x.id === id);
        return [...current.slice(0, index), {...current[index], name: char.name, calling: char.calling?.name, str: char.str.max, dex: char.dex.max, wil: char.wil.max}, ...current.slice(index + 1)];
      });
    });
    return sheet;
  }
}

export const manager = new Manager();
