import 'fake-indexeddb/auto';
import { createStore, get, set, entries, type UseStore } from 'idb-keyval';
import { beforeEach, describe, expect, it } from 'vitest';
import legacy from './sheet-format/fixtures/legacy-root.json';
import { migrateLegacyStorage, tombstoneKey } from './sheet-recovery';
import { normalizeLegacySheet } from './legacy-sheet';
import { transaction } from './storage-transaction';

class MemoryStorage implements Storage {
  data = new Map<string, string>();
  get length() {
    return this.data.size;
  }
  key(i: number) {
    return [...this.data.keys()][i] ?? null;
  }
  getItem(k: string) {
    return this.data.get(k) ?? null;
  }
  setItem(k: string, v: string) {
    this.data.set(k, v);
  }
  removeItem(k: string) {
    this.data.delete(k);
  }
  clear() {
    this.data.clear();
  }
}
let storage: MemoryStorage;
let db: UseStore;
const key = 'bw-sheet-hero_01';
beforeEach(() => {
  storage = new MemoryStorage();
  db = createStore(`migration-${crypto.randomUUID()}`, 'keyval');
  storage.setItem(key, JSON.stringify(legacy));
  storage.setItem('bw-sheet-list', JSON.stringify([{ id: legacy.id }]));
});

describe('recoverable legacy migration', () => {
  it('archives exact source bytes and commits a read-back-verified sheet without deleting originals', async () => {
    const original = storage.getItem(key);
    expect(await migrateLegacyStorage(storage, db)).toEqual({ migrated: 1, issues: [] });
    const saved = await get(key, db);
    expect(saved.statuses).toEqual(new Set(legacy.statuses));
    expect(saved.str.current).toBe(0);
    expect(saved.settings).toEqual(legacy.settings);
    expect(saved.unknownLegacyField).toEqual(legacy.unknownLegacyField);
    expect(storage.getItem(key)).toBe(original);
    const archived = (await entries<string, { raw?: string }>(db)).filter(([k]) =>
      k.startsWith('bw-recovery:'),
    );
    expect(archived.some(([, value]) => value.raw === original)).toBe(true);
  });

  it('is idempotent even after a newer sheet edit', async () => {
    await migrateLegacyStorage(storage, db);
    const saved = await get(key, db);
    saved.name = 'Newer name';
    await set(key, saved, db);
    expect((await migrateLegacyStorage(storage, db)).migrated).toBe(0);
    expect((await get(key, db)).name).toBe('Newer name');
  });

  it('does not replay a committed migration whose destination was removed before restart', async () => {
    await migrateLegacyStorage(storage, db);
    await transaction(
      'readwrite',
      (store) => {
        store.delete(key);
      },
      db,
    );
    expect((await migrateLegacyStorage(storage, db)).migrated).toBe(0);
    expect(await get(key, db)).toBeUndefined();
  });

  it('keeps divergent IndexedDB and localStorage records independently recoverable', async () => {
    await set(key, { ...normalizeLegacySheet(legacy, legacy.id), name: 'Current' }, db);
    const result = await migrateLegacyStorage(storage, db);
    expect(result.issues[0].message).toContain('Both copies');
    expect((await get(key, db)).name).toBe('Current');
    expect(storage.getItem(key)).toBe(JSON.stringify(legacy));
  });

  it('refuses a changed legacy source after a completed migration', async () => {
    await migrateLegacyStorage(storage, db);
    storage.setItem(key, JSON.stringify({ ...legacy, name: 'Changed in an old tab' }));
    expect((await migrateLegacyStorage(storage, db)).issues[0].message).toContain('Both copies');
    expect((await get(key, db)).name).toBe('Mara');
  });

  it('rolls back archive, journal and sheet together on quota failure and can retry', async () => {
    const broken: UseStore = (mode, callback) =>
      db(mode, (store) => {
        const put = store.put.bind(store);
        store.put = ((value: unknown, k?: IDBValidKey) => {
          if (k === key) throw new DOMException('No space', 'QuotaExceededError');
          return put(value, k);
        }) as IDBObjectStore['put'];
        return callback(store);
      });
    await expect(migrateLegacyStorage(storage, broken)).rejects.toThrow('No space');
    expect(await get(key, db)).toBeUndefined();
    expect((await entries<string>(db)).some(([k]) => k.startsWith('bw-migration:'))).toBe(false);
    expect(storage.getItem(key)).toBe(JSON.stringify(legacy));
    expect((await migrateLegacyStorage(storage, db)).migrated).toBe(1);
  });

  it('recovers valid orphan records while isolating corrupt, mismatched and list-only records', async () => {
    storage.setItem('bw-sheet-list', JSON.stringify([{ id: 'missing' }]));
    storage.setItem('bw-sheet-broken', '{bad json');
    storage.setItem('bw-sheet-wrong', JSON.stringify(legacy));
    const report = await migrateLegacyStorage(storage, db);
    expect(report.migrated).toBe(1);
    expect(report.issues.map((x) => x.key)).toEqual(
      expect.arrayContaining(['bw-sheet-broken', 'bw-sheet-wrong', 'bw-sheet-missing']),
    );
    expect(await get('bw-sheet-wrong', db)).toBeUndefined();
  });

  it('recovers an unambiguous missing ID from the key and preserves list order', async () => {
    const { id: _, ...withoutId } = legacy;
    storage.setItem(key, JSON.stringify(withoutId));
    const report = await migrateLegacyStorage(storage, db);
    expect(report.migrated).toBe(1);
    expect(await get(key, db)).toMatchObject({ id: legacy.id, created: 1, sortkey: 1 });
  });

  it('honors deletion tombstones even when an old tab changes its retained source', async () => {
    await migrateLegacyStorage(storage, db);
    await transaction(
      'readwrite',
      (store) => {
        store.put({ deletedAt: 1 }, tombstoneKey(legacy.id));
        store.delete(key);
      },
      db,
    );
    storage.setItem(key, JSON.stringify({ ...legacy, name: 'Old tab update' }));
    expect((await migrateLegacyStorage(storage, db)).migrated).toBe(0);
    expect(await get(key, db)).toBeUndefined();
  });

  it('serializes competing tabs using readwrite transactions without clobbering data', async () => {
    const reports = await Promise.all([
      migrateLegacyStorage(storage, db),
      migrateLegacyStorage(storage, db),
    ]);
    expect(reports.reduce((n, report) => n + report.migrated, 0)).toBe(1);
    expect((await get(key, db)).name).toBe(legacy.name);
  });

  it('does not create a destination when database access is denied', async () => {
    const unavailable: UseStore = async () => {
      throw new DOMException('Denied', 'SecurityError');
    };
    await expect(migrateLegacyStorage(storage, unavailable)).rejects.toThrow('Denied');
    expect(storage.getItem(key)).toBe(JSON.stringify(legacy));
  });
});
