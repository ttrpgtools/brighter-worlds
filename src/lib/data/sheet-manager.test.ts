import { describe, expect, it, vi } from 'vitest';
import { get, writable, type Updater } from 'svelte/store';
import type { Character, CharacterSummary } from '$lib/types';

vi.mock('./idb-store', () => ({
  createIdbStore<T>(_key: string, initialValue: T) {
    const internal = writable(initialValue);
    return {
      ...internal,
      loaded: Promise.resolve(),
      async set(value: T) {
        internal.set(value);
      },
      async update(updater: Updater<T>) {
        internal.update(updater);
      },
    };
  },
  del: vi.fn(),
  filteredValues: vi.fn(async () => []),
}));

const summary: CharacterSummary = {
  id: 'character-1',
  name: 'Old Name',
  calling: 'Old Calling',
  str: 4,
  dex: 4,
  wil: 4,
  created: 1,
  sortkey: 1,
};

function character(name: string): Character {
  return {
    id: 'character-1',
    name,
    pronouns: '',
    grit: { current: 3, max: 3 },
    str: { current: 6, max: 6 },
    dex: { current: 8, max: 8 },
    wil: { current: 10, max: 10 },
    statuses: new Set<string>(),
    equipment: [],
    calling: { id: 'calling-1', name: 'Knight' },
    abilities: [],
    eulogy: [],
    spells: [],
    rituals: [],
    notes: '',
    created: 123,
    sortkey: 456,
  };
}

describe('loadSheet', () => {
  it('refreshes the character summary when a sheet is set', async () => {
    const { loadSheet } = await import('./sheet-manager');
    const list = writable<CharacterSummary[] | undefined>([summary]);
    const sheet = loadSheet('character-1', list);

    await sheet.set(character('New Name'));

    expect(get(list)).toEqual([
      {
        id: 'character-1',
        name: 'New Name',
        calling: 'Knight',
        str: 6,
        dex: 8,
        wil: 10,
        created: 123,
        sortkey: 456,
      },
    ]);
  });

  it('refreshes the character summary when a sheet is updated', async () => {
    const { loadSheet } = await import('./sheet-manager');
    const list = writable<CharacterSummary[] | undefined>([summary]);
    const sheet = loadSheet('character-1', list);

    await sheet.set(character('New Name'));
    await sheet.update((current) => ({
      ...current,
      name: 'Newest Name',
    }));

    expect(get(list)?.[0].name).toBe('Newest Name');
  });

  it('uses cached sheet stores with summary-updating wrappers', async () => {
    const { loadSheet } = await import('./sheet-manager');
    const list = writable<CharacterSummary[] | undefined>([summary]);
    const cache = new Map();
    loadSheet('character-1', undefined, cache);
    const sheet = loadSheet('character-1', list, cache);

    await sheet.set(character('Cached Name'));

    expect(get(list)?.[0].name).toBe('Cached Name');
  });
});
