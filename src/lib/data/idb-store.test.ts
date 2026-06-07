import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createRuneProxy } from '$lib/util/snapshot.fixture.svelte';

const stored = new Map<string, unknown>();

vi.mock('idb-keyval', () => ({
  async get<T>(key: string) {
    return stored.get(key) as T | undefined;
  },
  async set(key: string, value: unknown) {
    structuredClone(value);
    stored.set(key, value);
  },
  async del(key: string) {
    stored.delete(key);
  },
  async entries() {
    return Array.from(stored.entries());
  },
}));

describe('createIdbStore', () => {
  beforeEach(() => {
    stored.clear();
    vi.stubGlobal('window', { indexedDB: {} });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('snapshots rune proxy values before writing them to IndexedDB', async () => {
    const { createIdbStore } = await import('./idb-store');
    const store = createIdbStore('sheet', { id: 'sheet-1', name: '' }, false);
    const sheet = createRuneProxy({ id: 'sheet-1', name: 'Rune Sheet' });

    await store.set(sheet);

    expect(stored.get('sheet')).toEqual({ id: 'sheet-1', name: 'Rune Sheet' });
  });

  it('snapshots rune proxy update results before writing them to IndexedDB', async () => {
    const { createIdbStore } = await import('./idb-store');
    const store = createIdbStore('sheet', { id: 'sheet-1', name: '' }, false);

    await store.update((current) => createRuneProxy({ ...current, name: 'Updated Rune Sheet' }));

    expect(stored.get('sheet')).toEqual({ id: 'sheet-1', name: 'Updated Rune Sheet' });
  });
});
