import 'fake-indexeddb/auto';
import { clear, get as readDb } from 'idb-keyval';
import { get } from 'svelte/store';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import legacy from './sheet-format/fixtures/legacy-root.json';
import { loadSheet } from './sheet-manager';
import { EMPTY } from '$lib/types';

beforeEach(async () => {
  await clear();
});
afterEach(() => {
  vi.unstubAllGlobals();
});
function source() {
  const values = new Map([['bw-sheet-hero_01', JSON.stringify(legacy)]]);
  return {
    get length() {
      return values.size;
    },
    key: (i: number) => [...values.keys()][i] ?? null,
    getItem: (key: string) => values.get(key) ?? null,
  };
}

it('a direct sheet URL waits for migration before reading and never saves a placeholder', async () => {
  vi.stubGlobal('window', { indexedDB, localStorage: source() });
  const sheet = loadSheet('hero_01');
  expect(get(sheet)[EMPTY]).toBe(true);
  await sheet.loaded;
  expect(get(sheet).name).toBe(legacy.name);
  expect((await readDb('bw-sheet-hero_01')).name).toBe(legacy.name);
});

it('a direct URL stays readable from the original when IndexedDB is unavailable, but cannot claim to save', async () => {
  vi.stubGlobal('window', { localStorage: source() });
  const sheet = loadSheet('hero_01');
  await sheet.loaded;
  expect(get(sheet).name).toBe(legacy.name);
  await expect(sheet.update((x) => ({ ...x, name: 'Unsaved' }))).rejects.toThrow('unavailable');
  expect(get(sheet).name).toBe('Unsaved');
  expect(window.localStorage.getItem('bw-sheet-hero_01')).toBe(JSON.stringify(legacy));
});
