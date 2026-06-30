import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createRuneProxy } from '$lib/util/snapshot.fixture.svelte';

const stored = new Map<string, unknown>();
const setStored = vi.fn(async (key: string, value: unknown) => {
  structuredClone(value);
  stored.set(key, value);
});

vi.mock('idb-keyval', () => ({
  async get<T>(key: string) {
    return stored.get(key) as T | undefined;
  },
  set: setStored,
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
    setStored.mockClear();
    setStored.mockImplementation(async (key: string, value: unknown) => {
      structuredClone(value);
      stored.set(key, value);
    });
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

  it('does not finish setting until the IndexedDB write finishes', async () => {
    stored.set('sheet', { id: 'sheet-1', name: 'Original' });
    let finishWrite: (() => void) | undefined;
    setStored.mockImplementationOnce(
      () =>
        new Promise<void>((resolve) => {
          finishWrite = resolve;
        }),
    );
    const { createIdbStore } = await import('./idb-store');
    const store = createIdbStore('sheet', { id: 'sheet-1', name: '' }, false);
    let finished = false;

    const writing = store.set({ id: 'sheet-1', name: 'Updated' }).then(() => {
      finished = true;
    });
    await vi.waitFor(() => expect(finishWrite).toBeDefined());

    expect(finished).toBe(false);
    finishWrite?.();
    await writing;
    expect(finished).toBe(true);
  });

  it('does not finish updating until the IndexedDB write finishes', async () => {
    stored.set('sheet', { id: 'sheet-1', name: 'Original' });
    let finishWrite: (() => void) | undefined;
    setStored.mockImplementationOnce(
      () =>
        new Promise<void>((resolve) => {
          finishWrite = resolve;
        }),
    );
    const { createIdbStore } = await import('./idb-store');
    const store = createIdbStore('sheet', { id: 'sheet-1', name: '' }, false);
    let finished = false;

    const writing = store.update((sheet) => ({ ...sheet, name: 'Updated' })).then(() => {
      finished = true;
    });
    await vi.waitFor(() => expect(finishWrite).toBeDefined());

    expect(finished).toBe(false);
    finishWrite?.();
    await writing;
    expect(finished).toBe(true);
  });
});
