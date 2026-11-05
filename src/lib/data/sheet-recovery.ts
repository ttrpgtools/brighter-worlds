import { writable } from 'svelte/store';
import type { UseStore } from 'idb-keyval';
import { normalizeLegacySheet, localFingerprint, validSheetId } from './legacy-sheet';
import { request, transaction, sheetDatabase } from './storage-transaction';

export const SHEET_PREFIX = 'bw-sheet-';
export const LIST_KEY = 'bw-sheet-list';
export async function rawDigest(raw: string) {
  return Array.from(
    new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(raw))),
  )
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}
export const tombstoneKey = (id: string) => `bw-migration:v1:deleted:${encodeURIComponent(id)}`;
export interface RecoveryIssue {
  key: string;
  message: string;
}
export interface MigrationReport {
  migrated: number;
  issues: RecoveryIssue[];
}
export const recoveryState = writable({
  busy: false,
  issues: [] as RecoveryIssue[],
  writeError: '',
});

export function reportRecoveryIssue(issue: RecoveryIssue) {
  recoveryState.update((s) => ({
    ...s,
    issues: [...s.issues.filter((x) => x.key !== issue.key), issue],
  }));
}

export function storageFailure(error: unknown) {
  // Never expose raw saved content or request bodies in errors.
  const name = error instanceof Error ? error.name : '';
  const message =
    name === 'QuotaExceededError'
      ? 'Browser storage is full. Changes are not saved; download a backup before leaving.'
      : 'Browser storage could not save changes. Download a backup before leaving and retry storage access.';
  recoveryState.update((state) => ({ ...state, writeError: message }));
}

export async function migrateLegacyStorage(
  storage: Storage,
  database: UseStore = sheetDatabase,
): Promise<MigrationReport> {
  const report: MigrationReport = { migrated: 0, issues: [] };
  const issue = (key: string, message: string) => report.issues.push({ key, message });
  const sources: [string, string][] = [];
  // Capture before writing anything; never mutate localStorage during automatic migration.
  for (let i = 0; i < storage.length; i++) {
    const key = storage.key(i);
    if (key?.startsWith(SHEET_PREFIX) && key !== LIST_KEY) {
      const raw = storage.getItem(key);
      if (raw !== null) sources.push([key, raw]);
    }
  }
  const listRaw = storage.getItem(LIST_KEY);
  let order: string[] = [];
  if (listRaw !== null) {
    try {
      const list = JSON.parse(listRaw);
      if (!Array.isArray(list) || !list.every((x) => x && validSheetId(x.id))) throw new Error();
      order = [...new Set<string>(list.map((x) => x.id))];
    } catch {
      issue(
        LIST_KEY,
        'The old character list is damaged. Individual saved records are still checked.',
      );
    }
    const awaitRawDigest = await rawDigest(listRaw);
    await transaction(
      'readwrite',
      (store) => {
        store.put(
          { version: 1, key: LIST_KEY, raw: listRaw },
          `bw-recovery:v1:index:${awaitRawDigest}`,
        );
      },
      database,
    );
  }
  for (const [key, raw] of sources) {
    const id = key.slice(SHEET_PREFIX.length);
    const journalKey = `bw-migration:v1:localstorage:${encodeURIComponent(key)}`;
    // Hash outside the IDB transaction, which must not wait for crypto work.
    const digest = await rawDigest(raw);
    let sheet: ReturnType<typeof normalizeLegacySheet> | undefined;
    let invalid = '';
    try {
      sheet = normalizeLegacySheet(JSON.parse(raw), id, Math.max(0, order.indexOf(id)) + 1);
    } catch (error) {
      invalid = error instanceof Error ? error.message : 'Invalid legacy record.';
    }
    const outcome = await transaction(
      'readwrite',
      async (store) => {
        const [previous, deleted, existing] = await Promise.all([
          request(store.get(journalKey)),
          request(store.get(tombstoneKey(id))),
          request(store.get(key)),
        ]);
        store.put(
          { version: 1, key, raw, digest },
          `bw-recovery:v1:localstorage:${encodeURIComponent(key)}:${digest}`,
        );
        if (deleted) return 'deleted';
        if (previous?.digest === digest && previous?.outcome === 'migrated') return 'already';
        let outcome: 'migrated' | 'conflict' | 'invalid' = invalid ? 'invalid' : 'migrated';
        if (sheet && existing !== undefined) {
          try {
            if (localFingerprint(normalizeLegacySheet(existing, id)) !== localFingerprint(sheet))
              outcome = 'conflict';
          } catch {
            outcome = 'conflict';
          }
        }
        // A completed journal is never replayed over a newer/deleted destination.
        if (previous?.outcome === 'migrated' && previous.digest !== digest) outcome = 'conflict';
        if (outcome === 'migrated' && existing === undefined) {
          store.put(sheet, key);
          const readback = await request(store.get(key));
          if (localFingerprint(readback) !== localFingerprint(sheet))
            throw new Error('Storage verification failed.');
        }
        store.put({ version: 1, digest, outcome }, journalKey);
        return outcome;
      },
      database,
    );
    if (outcome === 'migrated') report.migrated++;
    if (outcome === 'invalid') issue(key, invalid);
    if (outcome === 'conflict')
      issue(key, 'An older record differs from the current sheet. Both copies were kept.');
  }
  for (const id of order) {
    if (!sources.some(([key]) => key === `${SHEET_PREFIX}${id}`)) {
      const exists = await transaction(
        'readonly',
        (store) => request(store.get(`${SHEET_PREFIX}${id}`)),
        database,
      );
      if (exists === undefined)
        issue(
          `${SHEET_PREFIX}${id}`,
          'The old list refers to a sheet whose saved record is missing.',
        );
    }
  }
  return report;
}

let pending: Promise<MigrationReport> | undefined;
export function ensureSheetMigration(): Promise<MigrationReport> {
  if (typeof window === 'undefined') return Promise.resolve({ migrated: 0, issues: [] });
  if (pending) return pending;
  recoveryState.update((s) => ({ ...s, busy: true }));
  pending = Promise.resolve()
    .then(() => {
      if (!window.indexedDB) throw new Error('IndexedDB unavailable.');
      return migrateLegacyStorage(window.localStorage);
    })
    .then((report) => {
      recoveryState.update((s) => ({ ...s, busy: false, issues: report.issues }));
      return report;
    })
    .catch(() => {
      const report = {
        migrated: 0,
        issues: [
          {
            key: 'storage',
            message:
              'Local storage could not be migrated. Original records are untouched. Download recovery records before leaving.',
          },
        ],
      };
      recoveryState.update((s) => ({ ...s, busy: false, issues: report.issues }));
      return report;
    })
    .finally(() => {
      pending = undefined;
    });
  return pending;
}

export function readLegacyFallback(id: string) {
  try {
    const raw = window.localStorage.getItem(`${SHEET_PREFIX}${id}`);
    if (raw !== null) return normalizeLegacySheet(JSON.parse(raw), id);
  } catch {
    /* The raw record remains available for download. */
  }
}

/** Explicit private recovery file, never used by portable exports/imports. */
export async function localRecoveryFile(cache?: import('./sheet-manager').SheetCache) {
  const { privateRecoveryFile } = await import('./private-recovery');
  return privateRecoveryFile(cache);
}
