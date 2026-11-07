import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { get as storeValue } from 'svelte/store';
import { createRuneProxy } from '$lib/util/snapshot.fixture.svelte';

const stored = new Map<string, unknown>();
const setStored = vi.fn(async (key: string, value: unknown) => {
  structuredClone(value);
  stored.set(key, value);
});

vi.mock('idb-keyval', async (importOriginal) => ({
  ...(await importOriginal<typeof import('idb-keyval')>()),
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
  it('never persists an empty placeholder merely by opening a missing sheet', async () => {
    const { createIdbStore } = await import('./idb-store');
    const { EMPTY } = await import('$lib/types');
    const store = createIdbStore('missing', { [EMPTY]: true, name: '' }, false);
    await store.loaded;
    expect(setStored).not.toHaveBeenCalled();
  });

  it('keeps newer edits visible while older writes wait and persists them in order', async () => {
    const { createIdbStore } = await import('./idb-store');
    const store = createIdbStore('sheet', { name: '' }, false);
    await store.loaded;
    let finish: (() => void) | undefined;
    setStored.mockImplementationOnce(
      () =>
        new Promise<void>((resolve) => {
          finish = resolve;
        }),
    );
    const first = store.set({ name: 'First' });
    await vi.waitFor(() => expect(finish).toBeDefined());
    const second = store.set({ name: 'Second' });
    expect(storeValue(store).name).toBe('Second');
    finish?.();
    await first;
    expect(storeValue(store).name).toBe('Second');
    await second;
    expect(stored.get('sheet')).toEqual({ name: 'Second' });
  });

  it('rejects unavailable browser persistence rather than claiming memory is durable', async () => {
    vi.stubGlobal('window', {});
    const { createIdbStore } = await import('./idb-store');
    const store = createIdbStore('sheet', { name: '' }, false, {
      fallback: () => ({ name: 'Recoverable' }),
    });
    await store.loaded;
    expect(storeValue(store).name).toBe('Recoverable');
    await expect(store.set({ name: 'Unsaved edit' })).rejects.toThrow('unavailable');
    expect(storeValue(store).name).toBe('Unsaved edit');
  });

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

    const writing = store
      .update((sheet) => ({ ...sheet, name: 'Updated' }))
      .then(() => {
        finished = true;
      });
    await vi.waitFor(() => expect(finishWrite).toBeDefined());

    expect(finished).toBe(false);
    finishWrite?.();
    await writing;
    expect(finished).toBe(true);
  });
});
