import { id } from "$lib/rolling/id";
import type { Calling, Character, CharacterSummary } from "$lib/types";
import type { Writable } from "svelte/store";
import { lazyFactory } from "./storage";

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
    calling: { name: '' },
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

  loadList() {
    this.list.load();
    this.loaded = true;
  }

  create(name: string, calling: Calling): [string, Writable<Character>]{
    const newId = id();
    if (!this.loaded) {
      this.loadList();
    }
    this.list.update((current) => ([...current, { id: newId, name, calling: calling.name }]));
    const sheet = this.getSheet(newId);
    sheet.load();
    // TODO load more of the calling.
    sheet.update((current) => ({...current, name, calling: { name: calling.name, desc: calling.tagline }}));
    return [newId, sheet];
  }

  getSheet(id: string) {
    const empty = getEmptySheet();
    empty.id = id;
    return lazyFactory<Character>(`${SHEET_KEY_PREFIX}${id}`, empty, { replacer: replaceSheet, reviver: reviveSheet });
  }
}

export const manager = new Manager();
