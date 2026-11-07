import { get, writable, type Updater } from 'svelte/store';
import { entries, type UseStore } from 'idb-keyval';
import { request, transaction, sheetDatabase } from './storage-transaction';
import { snapshotState } from '$lib/util/snapshot.svelte';
import { getEmptySheet } from './sheet-manager';
import { normalizeLegacySheet } from './legacy-sheet';
import { reportRecoveryIssue } from './sheet-recovery';
import { isEmpty, type Character } from '$lib/types';
import {
  assertSheet,
  canonical,
  encodeSheet,
  ExportContext,
  hydrateSheet,
  imageRefs,
  buildBundle,
} from './sheet-format/codec';
import type { SheetDocumentV1 } from './sheet-format/types';
import type { AegisDoc } from '$lib/server/aegis';
import { accountClient, AccountError, type AccountClient } from './account-client';
import { canReadAccount, canSaveAccount, type AccountSession } from './account-session';

export const accountKey = (owner: string, id: string) =>
  `bw-document:v1:account:${encodeURIComponent(owner)}:${id}`;
export interface AccountRecord {
  format: 'bw-account-cache';
  version: 1;
  owner: string;
  id: string;
  token: string;
  character: Character;
  revision: number;
  savedRevision: number;
  remoteVersion?: number;
  base?: SheetDocumentV1;
  lastSaved?: number;
  error?: { code: string; message: string };
  pending?: { id: string; document: SheetDocumentV1; revision: number; version?: number };
  conflict?: AegisDoc;
  deleted?: boolean;
}
export interface AccountStatus {
  phase: 'loading' | 'saved' | 'dirty' | 'saving' | 'conflict' | 'missing' | 'error' | 'signed-out';
  message: string;
  accessible: boolean;
  record?: AccountRecord;
  localError?: string;
}
function validateCache(row: AccountRecord, owner: string, id: string) {
  if (
    row.format !== 'bw-account-cache' ||
    row.version !== 1 ||
    row.owner !== owner ||
    row.id !== id ||
    typeof row.token !== 'string' ||
    !Number.isSafeInteger(row.revision) ||
    row.revision < 0 ||
    !Number.isSafeInteger(row.savedRevision) ||
    row.savedRevision < -1 ||
    row.savedRevision > row.revision ||
    (row.remoteVersion !== undefined &&
      (!Number.isSafeInteger(row.remoteVersion) || row.remoteVersion < 1))
  ) {
    throw new Error('The cached account record is invalid. Keep a private recovery archive.');
  }
  normalizeLegacySheet(row.character, id);
  if (row.base) assertSheet(row.base);
  if (row.pending) {
    assertSheet(row.pending.document);
    if (
      row.pending.document.id !== id ||
      imageRefs(row.pending.document).length ||
      !Number.isSafeInteger(row.pending.revision) ||
      row.pending.revision < 0 ||
      row.pending.revision > row.revision
    )
      throw new Error('The pending account operation is invalid. Keep a private recovery archive.');
  }
}
export async function portableCharacter(character: Character) {
  const context = new ExportContext(typeof window === 'undefined' ? null : window.location.origin);
  const { document } = await encodeSheet(snapshotState(character), context, character.id);
  if (context.assets.size || imageRefs(document).length)
    throw new AccountError(
      'images',
      'Embedded images are kept locally. Online saving currently needs image URLs; download a backup to keep the original bytes.',
    );
  return document;
}
export function fromRemote(owner: string, remote: AegisDoc): AccountRecord {
  assertSheet(remote.data);
  return {
    format: 'bw-account-cache',
    version: 1,
    owner,
    id: remote.docId,
    token: crypto.randomUUID(),
    character: hydrateSheet(
      remote.data,
      new Map(),
      new Map(),
      new Set(remote.data.relations.map((x) => x.sheetId)),
    ),
    revision: 0,
    savedRevision: 0,
    remoteVersion: remote.version,
    base: remote.data,
    lastSaved: remote.updatedAt,
  };
}
export async function cachedAccount(owner: string, database: UseStore = sheetDatabase) {
  return (await entries<string, AccountRecord>(database))
    .filter(
      ([key, row]) =>
        key.startsWith(`bw-document:v1:account:${encodeURIComponent(owner)}:`) &&
        row?.format === 'bw-account-cache' &&
        row.owner === owner,
    )
    .flatMap(([key, row]) => {
      try {
        validateCache(row, owner, row.id);
        return [row];
      } catch {
        reportRecoveryIssue({
          key,
          message: 'A cached account draft needs private recovery. Its original record was kept.',
        });
        return [];
      }
    });
}
export function createAccountSheet(
  owner: string,
  id: string,
  session: AccountSession,
  options: { database?: UseStore; client?: AccountClient; autoSave?: boolean } = {},
) {
  const database = options.database ?? sheetDatabase;
  const client = options.client ?? accountClient(owner);
  const key = accountKey(owner, id);
  const empty = getEmptySheet();
  empty.id = id;
  const value = writable<Character>(empty);
  const state = writable<AccountStatus>({
    phase: 'loading',
    message: 'Loading account sheet…',
    accessible: false,
  });
  let record: AccountRecord | undefined;
  let localQueue = Promise.resolve();
  let saving: Promise<void> | undefined;
  let disposed = false;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let localError = '';
  function status() {
    const accessible = canReadAccount(session, owner);
    let phase: AccountStatus['phase'] = 'dirty';
    let message = 'Changes saved in this browser; waiting to save online.';
    if (!accessible) {
      phase = 'signed-out';
      message = 'Sign in to the account that owns this sheet. Its draft is kept in this browser.';
    } else if (localError) {
      phase = 'error';
      message = localError;
    } else if (record?.deleted || record?.error?.code === 'not_found') {
      phase = 'missing';
      message =
        'This account sheet was deleted online. Your cached draft is kept; save a new copy to continue.';
    } else if (record?.conflict) {
      phase = 'conflict';
      message = 'This sheet changed elsewhere. Both copies are kept until you choose.';
    } else if (record?.error) {
      phase = 'error';
      message = record.error.message;
    } else if (saving) {
      phase = 'saving';
      message = 'Saving online…';
    } else if (
      record &&
      record.savedRevision === record.revision &&
      record.remoteVersion &&
      !record.pending
    ) {
      phase = 'saved';
      message = 'Saved online';
    }
    if (
      accessible &&
      !canSaveAccount(session, owner) &&
      !localError &&
      !['missing', 'conflict'].includes(phase)
    ) {
      phase = 'dirty';
      message = 'Offline or account access unavailable. Changes stay in this browser.';
    }
    state.set({
      phase,
      message,
      accessible,
      record: record ? structuredClone(record) : undefined,
      localError: localError || undefined,
    });
  }
  function commit(
    change: (current: AccountRecord | undefined) => AccountRecord,
    archive?: unknown,
  ): Promise<void> {
    const operation = localQueue.then(async () => {
      const next = change(record);
      next.token = crypto.randomUUID();
      const expected = record?.token;
      const collision = await transaction(
        'readwrite',
        async (store) => {
          const current = (await request(store.get(key))) as AccountRecord | undefined;
          if (current?.token !== expected) {
            store.put(
              { owner, id, character: snapshotState(get(value)), at: Date.now() },
              `bw-recovery:account:${crypto.randomUUID()}`,
            );
            return true;
          }
          if (archive) store.put(archive, `bw-recovery:account:${crypto.randomUUID()}`);
          store.put(next, key);
          return false;
        },
        database,
      );
      if (collision)
        throw new AccountError(
          'local_conflict',
          'Another tab changed this cached draft. Your edits were archived for recovery. Reload this page before continuing.',
        );
      record = next;
      localError = '';
      status();
    });
    localQueue = operation.catch((error) => {
      localError =
        error instanceof Error
          ? error.message
          : 'The local draft could not be saved. Export it before leaving.';
      status();
    });
    void operation.catch(() => {});
    return operation;
  }
  function validEpoch(epoch: number) {
    return !disposed && session.current().epoch === epoch && canSaveAccount(session, owner);
  }
  async function acknowledge(
    pending: NonNullable<AccountRecord['pending']>,
    version: number,
    time = Date.now(),
  ) {
    await localQueue;
    if (record?.pending?.id !== pending.id) return;
    if (!Number.isSafeInteger(version) || version < 1)
      throw new AccountError(
        'network',
        'The server did not confirm a storage version. Your pending draft was kept.',
      );
    await commit((current) => ({
      ...current!,
      remoteVersion: version,
      savedRevision: pending.revision,
      base: pending.document,
      lastSaved: time,
      pending: undefined,
      error: undefined,
      conflict: undefined,
    }));
  }
  async function pull() {
    if (!canSaveAccount(session, owner)) {
      status();
      return;
    }
    const epoch = session.current().epoch;
    try {
      const remote = await client.get(id);
      if (!validEpoch(epoch)) return;
      await localQueue;
      const candidate = record && !record.remoteVersion && !record.pending ? record : undefined;
      const matches = candidate
        ? canonical(await portableCharacter(candidate.character)) === canonical(remote.data)
        : false;
      await localQueue;
      if (!validEpoch(epoch)) return;
      if (candidate && matches && record && !record.remoteVersion && !record.pending) {
        await commit((current) =>
          current!.remoteVersion || current!.pending
            ? { ...current! }
            : {
                ...current!,
                remoteVersion: remote.version,
                savedRevision: candidate.revision,
                base: remote.data,
                lastSaved: remote.updatedAt,
                error: undefined,
              },
        );
      } else if (record?.pending && canonical(remote.data) === canonical(record.pending.document)) {
        await acknowledge(record.pending, remote.version, remote.updatedAt);
      } else if (
        !record ||
        (!record.pending && record.revision === record.savedRevision && !record.deleted)
      ) {
        const old = record;
        if (!old || old.remoteVersion !== remote.version) {
          const displayed = get(value);
          await commit(() => {
            const next = fromRemote(owner, remote);
            next.character.settings = old?.character.settings;
            return next;
          }, old);
          if (get(value) === displayed) value.set(structuredClone(record!.character));
        } else if (old.error) await commit((current) => ({ ...current!, error: undefined }));
      } else if (record.remoteVersion !== remote.version) {
        await commit((current) => ({ ...current!, conflict: remote, error: undefined }));
      }
    } catch (error) {
      if (!validEpoch(epoch)) return;
      if (
        record &&
        error instanceof AccountError &&
        error.code === 'not_found' &&
        !record.remoteVersion
      )
        status();
      else if (record)
        await commit((current) => ({
          ...current!,
          error: {
            code: error instanceof AccountError ? error.code : 'network',
            message: error instanceof Error ? error.message : 'Account storage unavailable.',
          },
        }));
      else {
        localError = error instanceof Error ? error.message : 'Account storage unavailable.';
        status();
      }
    }
    status();
  }
  const loaded = (async () => {
    if (typeof window === 'undefined' && !options.database) return;
    record = await transaction('readonly', (store) => request(store.get(key)), database).catch(
      () => undefined,
    );
    if (record) validateCache(record, owner, id);
    await session.refresh();
    if (record && canReadAccount(session, owner)) value.set(structuredClone(record.character));
    if (canSaveAccount(session, owner)) await pull();
    else status();
  })().catch((error) => {
    localError = String(error);
    status();
  });
  function schedule() {
    if (options.autoSave === false || disposed) return;
    clearTimeout(timer);
    timer = setTimeout(() => {
      void flush().catch(() => {});
    }, 700);
  }
  function set(next: Character): Promise<void> {
    const snapshot = snapshotState(next);
    if (isEmpty(snapshot)) return Promise.resolve();
    if (!canReadAccount(session, owner))
      return Promise.reject(
        new AccountError('account_changed', 'Sign in to this sheet’s owner before editing.'),
      );
    value.set(snapshot);
    const operation = loaded
      .then(() =>
        commit((current) => {
          if (!current)
            throw new AccountError('not_found', 'Load the account sheet before editing.');
          return {
            ...current,
            character: snapshot,
            revision: current.revision + 1,
            error: current.conflict ? current.error : undefined,
          };
        }),
      )
      .then(() => schedule());
    void operation.catch(() => {});
    return operation;
  }
  async function runSave() {
    await loaded;
    await session.refresh();
    if (!canSaveAccount(session, owner)) {
      status();
      return;
    }
    const epoch = session.current().epoch;
    for (let count = 0; count < 10 && validEpoch(epoch); count++) {
      await localQueue;
      if (
        !record ||
        record.conflict ||
        record.deleted ||
        localError ||
        record.error?.code === 'not_found'
      )
        break;
      if (record.revision === record.savedRevision && record.remoteVersion && !record.pending)
        break;
      let pending = record.pending;
      if (pending) {
        try {
          const remote = await client.get(id);
          if (!validEpoch(epoch)) return;
          if (canonical(remote.data) === canonical(pending.document)) {
            await acknowledge(pending, remote.version, remote.updatedAt);
            continue;
          }
          if (!pending.version || remote.version !== pending.version) {
            await commit((current) => ({ ...current!, conflict: remote, error: undefined }));
            break;
          }
        } catch (error) {
          if (!(error instanceof AccountError && error.code === 'not_found' && !pending.version))
            throw error;
        }
      } else {
        const revision = record.revision;
        const document = await portableCharacter(record.character);
        if (record.base && canonical(document) === canonical(record.base)) {
          await commit((current) => ({ ...current!, savedRevision: revision, error: undefined }));
          continue;
        }
        pending = { id: crypto.randomUUID(), revision, document, version: record.remoteVersion };
        await commit((current) => ({ ...current!, pending, error: undefined }));
      }
      if (!validEpoch(epoch)) return;
      try {
        const result = pending.version
          ? await client.update(pending.document, pending.version)
          : await client.create(pending.document);
        if (!validEpoch(epoch)) return;
        await acknowledge(pending, result.version, result.updatedAt);
      } catch (error) {
        if (!validEpoch(epoch)) return;
        if (error instanceof AccountError && ['conflict', 'exists'].includes(error.code)) {
          const remote = await client.get(id);
          if (!validEpoch(epoch)) return;
          if (canonical(remote.data) === canonical(pending.document))
            await acknowledge(pending, remote.version, remote.updatedAt);
          else {
            await commit((current) => ({ ...current!, conflict: remote, error: undefined }));
            break;
          }
        } else throw error;
      }
    }
  }
  function flush(): Promise<void> {
    if (saving) return saving;
    clearTimeout(timer);
    saving = runSave()
      .catch(async (error) => {
        if (!disposed && record && canSaveAccount(session, owner))
          await commit((current) => ({
            ...current!,
            error: {
              code: error instanceof AccountError ? error.code : 'network',
              message: error instanceof Error ? error.message : 'Account saving failed.',
            },
          })).catch(() => {});
      })
      .finally(() => {
        saving = undefined;
        status();
        if (
          record &&
          !localError &&
          !record.error &&
          !record.conflict &&
          !record.deleted &&
          canSaveAccount(session, owner) &&
          (record.pending || record.revision !== record.savedRevision)
        )
          schedule();
      });
    status();
    return saving;
  }
  async function review() {
    await loaded;
    await session.refresh();
    if (!canSaveAccount(session, owner))
      throw new AccountError('account_changed', 'Sign in to this sheet’s account.');
    const epoch = session.current().epoch;
    const remote = await client.get(id);
    if (!validEpoch(epoch)) throw new AccountError('account_changed', 'The account changed.');
    await localQueue;
    return { remote, revision: record!.revision, token: record!.token };
  }
  async function resolve(
    choice: 'reload' | 'replace',
    preview: Awaited<ReturnType<typeof review>>,
  ) {
    await localQueue;
    if (!canSaveAccount(session, owner) || record?.token !== preview.token)
      throw new AccountError('changed', 'The draft changed. Review both copies again.');
    const archive = { local: record, remote: preview.remote };
    if (choice === 'reload') {
      const displayed = get(value);
      await commit(() => {
        const next = fromRemote(owner, preview.remote);
        next.character.settings = record?.character.settings;
        return next;
      }, archive);
      if (get(value) === displayed) value.set(structuredClone(record!.character));
    } else {
      await commit(
        (current) => ({
          ...current!,
          remoteVersion: preview.remote.version,
          base: preview.remote.data,
          savedRevision: -1,
          pending: undefined,
          conflict: undefined,
          error: undefined,
        }),
        archive,
      );
      await flush();
    }
  }
  async function deleteOnline() {
    await loaded;
    await session.refresh();
    await localQueue;
    if (!record?.remoteVersion || !canSaveAccount(session, owner))
      throw new AccountError(
        'account_changed',
        'Sign in and load the account version before deleting.',
      );
    const epoch = session.current().epoch;
    await transaction(
      'readwrite',
      (store) => {
        store.put(record, `bw-recovery:account:${crypto.randomUUID()}`);
      },
      database,
    );
    await client.delete(id, record.remoteVersion);
    if (validEpoch(epoch))
      await commit((current) => ({
        ...current!,
        deleted: true,
        pending: undefined,
        conflict: undefined,
        error: undefined,
      }));
  }
  const stopSession = session.subscribe(() => {
    if (record && !localError && canReadAccount(session, owner) && isEmpty(get(value)))
      value.set(structuredClone(record.character));
    status();
  });
  return {
    sheet: {
      subscribe: value.subscribe,
      loaded,
      set,
      update: (fn: Updater<Character>) => loaded.then(() => set(fn(get(value)))),
    },
    status: { subscribe: state.subscribe },
    loaded,
    flush,
    review,
    resolve,
    deleteOnline,
    async refresh() {
      await loaded;
      await session.refresh();
      await pull();
    },
    snapshot: () => snapshotState(get(value)),
    dispose() {
      disposed = true;
      clearTimeout(timer);
      stopSession();
    },
  };
}
export type AccountSheet = ReturnType<typeof createAccountSheet>;
export async function accountBundle(
  owner: string,
  root: string,
  database: UseStore = sheetDatabase,
  current?: Character,
) {
  const rows = await cachedAccount(owner, database).catch(() => []);
  const records = new Map(rows.map((row) => [row.id, row.character]));
  if (current) records.set(current.id, current);
  const result = await buildBundle(
    records,
    [root],
    typeof window === 'undefined' ? null : window.location.origin,
  );
  result.bundle.source.storage = 'account';
  return result;
}

/** Fetch a linked group for offline use without replacing dirty cached drafts. */
export async function cacheAccountGraph(
  owner: string,
  root: string,
  session: AccountSession,
  database: UseStore = sheetDatabase,
) {
  await session.refresh();
  if (!canSaveAccount(session, owner)) return;
  const epoch = session.current().epoch;
  const client = accountClient(owner);
  const seen = new Set<string>();
  async function visit(id: string) {
    if (seen.has(id)) return;
    seen.add(id);
    if (seen.size > 100) throw new Error('This linked group is too large to open at once.');
    const remote = await client.get(id);
    if (session.current().epoch !== epoch || !canSaveAccount(session, owner))
      throw new AccountError('account_changed', 'The account changed.');
    await transaction(
      'readwrite',
      async (store) => {
        const key = accountKey(owner, id);
        const row = (await request(store.get(key))) as AccountRecord | undefined;
        if (!row) store.put(fromRemote(owner, remote), key);
        else if (
          !row.pending &&
          !row.deleted &&
          row.revision === row.savedRevision &&
          row.remoteVersion !== remote.version
        ) {
          const next = fromRemote(owner, remote);
          next.character.settings = row.character.settings;
          store.put(row, `bw-recovery:account:${crypto.randomUUID()}`);
          store.put(next, key);
        }
      },
      database,
    );
    for (const relation of remote.data.relations) await visit(relation.sheetId);
  }
  await visit(root);
}
export async function removeAccountCache(
  owner: string,
  id: string,
  database: UseStore = sheetDatabase,
) {
  await transaction(
    'readwrite',
    async (store) => {
      const key = accountKey(owner, id);
      const row = await request(store.get(key));
      if (row) store.put(row, `bw-recovery:account:${crypto.randomUUID()}`);
      store.delete(key);
    },
    database,
  );
}
