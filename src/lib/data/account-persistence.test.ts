import 'fake-indexeddb/auto';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { clear, createStore, entries, get as readDb, set as writeDb } from 'idb-keyval';
import { get, writable } from 'svelte/store';
import fixture from './sheet-format/fixtures/sheet-v1.json';
import type { SheetDocumentV1 } from './sheet-format/types';
import type { AegisDoc } from '$lib/server/aegis';
import { AccountError, type AccountClient } from './account-client';
import { type Account, type AccountSession } from './account-session';
import {
  accountKey,
  createAccountSheet,
  fromRemote,
  type AccountSheet,
} from './account-persistence';
import { sheetDatabase } from './storage-transaction';
import { ExportContext } from './sheet-format/codec';

const controllers: AccountSheet[] = [];
beforeEach(async () => {
  await clear(sheetDatabase);
});
afterEach(() => {
  controllers.splice(0).forEach((controller) => controller.dispose());
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});
function document(): SheetDocumentV1 {
  const data = structuredClone(fixture) as SheetDocumentV1;
  data.relations = [];
  data.character.abilities = data.character.abilities.filter((x) => x.type !== 'companion');
  return data;
}
function session(owner: string | null = 'owner-A') {
  const account = (id: string | null): Account => ({
    state: id ? 'authenticated' : 'signed-out',
    user: id ? { id, displayName: id, email: undefined, avatar: undefined } : null,
    allowed: !!id,
    accessUnavailable: false,
    reason: undefined,
    storageConfigured: true,
    accountUrl: 'https://ankh.example.invalid/account',
  });
  const state = writable({
    account: account(owner) as Account | null,
    epoch: 1,
    offlineOwner: undefined as string | undefined,
  });
  const value = {
    subscribe: state.subscribe,
    current: () => get(state),
    refresh: async () => {},
  } satisfies AccountSession;
  return {
    value,
    change: (id: string | null) =>
      state.update((old) => ({
        account: account(id),
        epoch: old.epoch + 1,
        offlineOwner: undefined,
      })),
    offline: (id: string) =>
      state.update((old) => ({ account: null, epoch: old.epoch + 1, offlineOwner: id })),
  };
}
function service(
  initial: AegisDoc | null = {
    docId: 'hero_01',
    data: document(),
    meta: null,
    version: 1,
    createdAt: 1,
    updatedAt: 1,
  },
) {
  let remote = initial;
  const client = {
    get: vi.fn(async (id: string) => {
      if (!remote || remote.docId !== id) throw new AccountError('not_found', 'Deleted online.');
      return structuredClone(remote);
    }),
    list: vi.fn(async () => ({ characters: [], nextCursor: null })),
    create: vi.fn(async (data: SheetDocumentV1) => {
      if (remote) throw new AccountError('exists', 'Exists');
      remote = {
        docId: data.id,
        data: structuredClone(data),
        meta: null,
        version: 1,
        createdAt: 1,
        updatedAt: 1,
      };
      return { version: 1, updatedAt: 1 };
    }),
    update: vi.fn(async (data: SheetDocumentV1, version: number) => {
      if (!remote) throw new AccountError('not_found', 'Deleted online.');
      if (remote.version !== version)
        throw new AccountError('conflict', 'Changed elsewhere.', remote.version);
      remote = {
        ...remote,
        data: structuredClone(data),
        version: version + 1,
        updatedAt: version + 1,
      };
      return { version: remote.version, updatedAt: remote.updatedAt };
    }),
    delete: vi.fn(async (_id: string, version: number) => {
      if (!remote) throw new AccountError('not_found', 'Deleted');
      if (remote.version !== version) throw new AccountError('conflict', 'Changed', remote.version);
      remote = null;
      return { ok: true as const };
    }),
  } satisfies AccountClient;
  return {
    client,
    remote: () => remote,
    change: (notes: string) => {
      remote = {
        ...remote!,
        data: { ...remote!.data, character: { ...remote!.data.character, notes } },
        version: remote!.version + 1,
      };
    },
    remove: () => {
      remote = null;
    },
  };
}
function open(auth: ReturnType<typeof session>, server: ReturnType<typeof service>) {
  const controller = createAccountSheet('owner-A', 'hero_01', auth.value, {
    client: server.client,
    database: sheetDatabase,
    autoSave: false,
  });
  controllers.push(controller);
  return controller;
}

it('stores drafts and versions atomically, and uploads only the portable allowlist', async () => {
  const auth = session();
  const server = service();
  const controller = open(auth, server);
  await controller.loaded;
  await controller.sheet.update((char) => ({
    ...char,
    name: 'Updated',
    settings: { rollToBridge: true, rollToDiscord: true, discordWebhook: 'private-sentinel' },
  }));
  const draft = await readDb(accountKey('owner-A', 'hero_01'), sheetDatabase);
  expect(draft.character.name).toBe('Updated');
  expect(draft.revision).toBe(1);
  expect(draft.savedRevision).toBe(0);
  await controller.flush();
  expect(get(controller.status).phase).toBe('saved');
  expect(server.client.update).toHaveBeenCalledWith(
    expect.objectContaining({
      id: 'hero_01',
      character: expect.objectContaining({ name: 'Updated' }),
    }),
    1,
  );
  expect(JSON.stringify(server.client.update.mock.calls)).not.toContain('private-sentinel');
  expect(
    (await readDb(accountKey('owner-A', 'hero_01'), sheetDatabase)).character.settings
      .discordWebhook,
  ).toBe('private-sentinel');
});
it('retains newer edits while an older save is in flight and serializes storage versions', async () => {
  const auth = session();
  const server = service();
  const controller = open(auth, server);
  await controller.loaded;
  const original = server.client.update.getMockImplementation()!;
  let release: () => void = () => {};
  let entered: () => void = () => {};
  const started = new Promise<void>((resolve) => {
    entered = resolve;
  });
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  server.client.update.mockImplementationOnce(async (data, version) => {
    entered();
    await gate;
    return original(data, version);
  });
  await controller.sheet.update((char) => ({ ...char, notes: 'First' }));
  const save = controller.flush();
  await started;
  await controller.sheet.update((char) => ({ ...char, notes: 'Newer' }));
  expect((await readDb(accountKey('owner-A', 'hero_01'), sheetDatabase)).character.notes).toBe(
    'Newer',
  );
  release();
  await save;
  expect(server.client.update.mock.calls.map(([, version]) => version)).toEqual([1, 2]);
  expect(server.remote()?.data.character.notes).toBe('Newer');
  expect(get(controller.status).phase).toBe('saved');
});
it('reconciles a lost create response after reload without another create or draft reset', async () => {
  const auth = session();
  const server = service(null);
  const cached = fromRemote('owner-A', {
    docId: 'hero_01',
    data: document(),
    meta: null,
    version: 1,
    createdAt: 1,
    updatedAt: 1,
  });
  cached.remoteVersion = undefined;
  cached.base = undefined;
  cached.savedRevision = -1;
  await writeDb(accountKey('owner-A', 'hero_01'), cached, sheetDatabase);
  const original = server.client.create.getMockImplementation()!;
  server.client.create.mockImplementationOnce(async (data) => {
    await original(data);
    throw new AccountError('network', 'Response lost');
  });
  const first = open(auth, server);
  await first.loaded;
  await first.flush();
  expect(get(first.status).phase).toBe('error');
  expect((await readDb(accountKey('owner-A', 'hero_01'), sheetDatabase)).pending).toBeDefined();
  first.dispose();
  const next = open(auth, server);
  await next.loaded;
  await next.flush();
  expect(server.client.create).toHaveBeenCalledOnce();
  expect(get(next.status).phase).toBe('saved');
});
it('keeps offline edits across reload and never shows them as saved online until acknowledged', async () => {
  const auth = session();
  const server = service();
  const first = open(auth, server);
  await first.loaded;
  auth.offline('owner-A');
  await first.sheet.update((char) => ({ ...char, notes: 'Offline draft' }));
  first.dispose();
  const next = open(auth, server);
  await next.loaded;
  expect(get(next.sheet).notes).toBe('Offline draft');
  expect(get(next.status).phase).not.toBe('saved');
  expect(server.client.update).not.toHaveBeenCalled();
  auth.change('owner-A');
  await next.flush();
  expect(server.remote()?.data.character.notes).toBe('Offline draft');
  expect(get(next.status).phase).toBe('saved');
});
it('isolates account caches and ignores a save response after account switching', async () => {
  const auth = session();
  const server = service();
  const controller = open(auth, server);
  await controller.loaded;
  let release: () => void = () => {};
  let entered: () => void = () => {};
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  const started = new Promise<void>((resolve) => {
    entered = resolve;
  });
  const original = server.client.update.getMockImplementation()!;
  server.client.update.mockImplementationOnce(async (data, version) => {
    entered();
    await gate;
    return original(data, version);
  });
  await controller.sheet.update((char) => ({ ...char, notes: 'A draft' }));
  const save = controller.flush();
  await started;
  auth.change('owner-B');
  release();
  await save;
  expect(get(controller.status).accessible).toBe(false);
  const cached = await readDb(accountKey('owner-A', 'hero_01'), sheetDatabase);
  expect(cached.pending).toBeDefined();
  expect(cached.savedRevision).toBe(0);
  expect(await readDb(accountKey('owner-B', 'hero_01'), sheetDatabase)).toBeUndefined();
  await controller.flush();
  expect(server.client.update).toHaveBeenCalledOnce();
  auth.change('owner-A');
  controller.dispose();
  const resumed = open(auth, server);
  await resumed.loaded;
  expect(get(resumed.status).phase).toBe('saved');
});
it('preserves a second tab’s conflicting local edit in recovery instead of overwriting the cache', async () => {
  const auth = session();
  const server = service();
  const first = open(auth, server);
  await first.loaded;
  const second = open(auth, server);
  await second.loaded;
  await first.sheet.update((char) => ({ ...char, notes: 'First tab' }));
  await expect(second.sheet.update((char) => ({ ...char, notes: 'Second tab' }))).rejects.toThrow(
    'Another tab',
  );
  expect((await readDb(accountKey('owner-A', 'hero_01'), sheetDatabase)).character.notes).toBe(
    'First tab',
  );
  const recovery = (await entries<string, any>(sheetDatabase)).filter(([key]) =>
    key.startsWith('bw-recovery:account:'),
  );
  expect(recovery.some(([, row]) => row.character?.notes === 'Second tab')).toBe(true);
  expect(get(second.status).phase).toBe('error');
});
it('keeps conflicts explicit and replaces only the exact online version that was reviewed', async () => {
  const auth = session();
  const server = service();
  const controller = open(auth, server);
  await controller.loaded;
  await controller.sheet.update((char) => ({ ...char, notes: 'My draft' }));
  server.change('Other device');
  await controller.flush();
  expect(get(controller.status).phase).toBe('conflict');
  expect(get(controller.sheet).notes).toBe('My draft');
  const preview = await controller.review();
  server.change('Changed after review');
  await controller.resolve('replace', preview);
  expect(get(controller.status).phase).toBe('conflict');
  expect(server.remote()?.data.character.notes).toBe('Changed after review');
  const fresh = await controller.review();
  await controller.resolve('replace', fresh);
  expect(server.remote()?.data.character.notes).toBe('My draft');
  expect(get(controller.status).phase).toBe('saved');
  const recovery = (await entries<string, any>(sheetDatabase)).filter(([key]) =>
    key.startsWith('bw-recovery:account:'),
  );
  expect(
    recovery.some(
      ([, row]) =>
        row.local?.character.notes === 'My draft' &&
        row.remote?.data.character.notes === 'Changed after review',
    ),
  ).toBe(true);
});
it('archives a draft before using the online copy and rejects a stale review after further typing', async () => {
  const auth = session();
  const server = service();
  const controller = open(auth, server);
  await controller.loaded;
  await controller.sheet.update((char) => ({ ...char, notes: 'My draft' }));
  server.change('Online');
  await controller.flush();
  const stale = await controller.review();
  await controller.sheet.update((char) => ({ ...char, notes: 'Typed later' }));
  await expect(controller.resolve('reload', stale)).rejects.toThrow('draft changed');
  const current = await controller.review();
  await controller.resolve('reload', current);
  expect(get(controller.sheet).notes).toBe('Online');
  expect(
    (await entries<string, any>(sheetDatabase)).some(
      ([key, row]) =>
        key.startsWith('bw-recovery:account:') && row.local?.character.notes === 'Typed later',
    ),
  ).toBe(true);
});
it.each(['storage_quota', 'network', 'images'])(
  'keeps an unsynced draft durable on %s failure',
  async (code) => {
    const auth = session();
    const server = service();
    const controller = open(auth, server);
    await controller.loaded;
    await controller.sheet.update((char) => ({ ...char, notes: 'Keep me' }));
    server.client.update.mockRejectedValue(new AccountError(code, 'Could not save online'));
    await controller.flush();
    expect(get(controller.status).phase).toBe('error');
    const cached = await readDb(accountKey('owner-A', 'hero_01'), sheetDatabase);
    expect(cached.character.notes).toBe('Keep me');
    expect(cached.savedRevision).toBeLessThan(cached.revision);
  },
);
it('does not resurrect a remotely deleted sheet through autosave or retry', async () => {
  const auth = session();
  const server = service();
  const controller = open(auth, server);
  await controller.loaded;
  await controller.sheet.update((char) => ({ ...char, notes: 'Keep deleted draft' }));
  server.remove();
  await controller.flush();
  await controller.flush();
  expect(get(controller.status).phase).toBe('missing');
  expect(server.client.create).not.toHaveBeenCalled();
  expect((await readDb(accountKey('owner-A', 'hero_01'), sheetDatabase)).character.notes).toBe(
    'Keep deleted draft',
  );
});
it('keeps a cached draft and recovery archive when explicitly deleting its versioned online copy', async () => {
  const auth = session();
  const server = service();
  const controller = open(auth, server);
  await controller.loaded;
  await controller.deleteOnline();
  expect(server.remote()).toBeNull();
  expect((await readDb(accountKey('owner-A', 'hero_01'), sheetDatabase)).deleted).toBe(true);
  expect(
    (await entries<string, any>(sheetDatabase)).some(
      ([key, row]) => key.startsWith('bw-recovery:account:') && row.owner === 'owner-A',
    ),
  ).toBe(true);
  await controller.flush();
  expect(server.client.create).not.toHaveBeenCalled();
});

it('never uploads after a local write fails, while retaining the current draft for export', async () => {
  const auth = session();
  const server = service();
  await writeDb(
    accountKey('owner-A', 'hero_01'),
    fromRemote('owner-A', server.remote()!),
    sheetDatabase,
  );
  const failWrites: typeof sheetDatabase = (mode, run) =>
    mode === 'readwrite'
      ? Promise.reject(new Error('Browser quota exceeded'))
      : sheetDatabase(mode, run);
  const controller = createAccountSheet('owner-A', 'hero_01', auth.value, {
    client: server.client,
    database: failWrites,
    autoSave: false,
  });
  controllers.push(controller);
  await controller.loaded;
  await expect(
    controller.sheet.update((char) => ({ ...char, notes: 'Unsaved memory draft' })),
  ).rejects.toThrow('quota');
  await controller.flush();
  expect(server.client.update).not.toHaveBeenCalled();
  expect(controller.snapshot().notes).toBe('Unsaved memory draft');
  expect(get(controller.status).phase).toBe('error');
});
it('preserves damaged account-cache records and does not upload them', async () => {
  const auth = session();
  const server = service();
  const damaged = { ...fromRemote('owner-A', server.remote()!), revision: -3 };
  await writeDb(accountKey('owner-A', 'hero_01'), damaged, sheetDatabase);
  const controller = open(auth, server);
  await controller.loaded;
  await controller.flush();
  expect(server.client.update).not.toHaveBeenCalled();
  expect(server.client.create).not.toHaveBeenCalled();
  expect(await readDb(accountKey('owner-A', 'hero_01'), sheetDatabase)).toEqual(damaged);
});

it('does not mark edits made while comparing an identical remote copy as saved', async () => {
  const auth = session();
  const server = service(null);
  const documentValue = document();
  const draft = fromRemote('owner-A', {
    docId: documentValue.id,
    data: documentValue,
    version: 1,
    meta: null,
    createdAt: 1,
    updatedAt: 1,
  });
  draft.remoteVersion = undefined;
  draft.savedRevision = -1;
  draft.base = undefined;
  await writeDb(accountKey('owner-A', 'hero_01'), draft, sheetDatabase);
  const controller = open(auth, server);
  await controller.loaded;
  await server.client.create(documentValue);
  let resume!: () => void;
  let entered!: () => void;
  const comparing = new Promise<void>((resolve) => {
    entered = resolve;
  });
  const blocked = new Promise<void>((resolve) => {
    resume = resolve;
  });
  const original = ExportContext.prototype.entity;
  vi.spyOn(ExportContext.prototype, 'entity').mockImplementationOnce(async function (
    this: ExportContext,
    ...args
  ) {
    entered();
    await blocked;
    return original.apply(this, args);
  });
  const refresh = controller.refresh();
  await comparing;
  await controller.sheet.update((char) => ({ ...char, notes: 'Newer than the comparison' }));
  resume();
  await refresh;
  const row = await readDb(accountKey('owner-A', 'hero_01'), sheetDatabase);
  expect(row.savedRevision).toBe(0);
  expect(row.revision).toBe(1);
  expect(get(controller.status).phase).toBe('dirty');
  await controller.flush();
  expect(server.remote()?.data.character.notes).toBe('Newer than the comparison');
  expect(get(controller.status).phase).toBe('saved');
});

it('reveals the cached draft only after its owner becomes accessible again', async () => {
  const auth = session('owner-B');
  const server = service();
  await writeDb(
    accountKey('owner-A', 'hero_01'),
    fromRemote('owner-A', server.remote()!),
    sheetDatabase,
  );
  const controller = open(auth, server);
  await controller.loaded;
  expect(controller.snapshot().name).not.toBe('Mara');
  auth.change('owner-A');
  expect(controller.snapshot().name).toBe('Mara');
  expect(server.client.get).not.toHaveBeenCalled();
});

it('sends an explicit conflict replacement even when the draft matches its older base', async () => {
  const auth = session();
  const server = service();
  const controller = open(auth, server);
  await controller.loaded;
  const original = controller.snapshot();
  await controller.sheet.update((char) => ({ ...char, notes: 'Changed temporarily' }));
  await controller.sheet.set(original);
  server.change('Different online content');
  await controller.refresh();
  expect(get(controller.status).phase).toBe('conflict');
  await controller.resolve('replace', await controller.review());
  expect(server.client.update).toHaveBeenCalledWith(
    expect.objectContaining({
      character: expect.objectContaining({ notes: original.notes }),
    }),
    2,
  );
  expect(server.remote()?.data.character.notes).toBe(original.notes);
  expect(get(controller.status).phase).toBe('saved');
});

it('keeps a visible edit made while a clean online refresh is being written to IndexedDB', async () => {
  const auth = session();
  const server = service();
  let delay = false;
  let resume!: () => void;
  let entered!: () => void;
  const blocked = new Promise<void>((resolve) => {
    resume = resolve;
  });
  const started = new Promise<void>((resolve) => {
    entered = resolve;
  });
  const database: typeof sheetDatabase = async (mode, run) => {
    if (delay && mode === 'readwrite') {
      delay = false;
      entered();
      await blocked;
    }
    return sheetDatabase(mode, run);
  };
  const controller = createAccountSheet('owner-A', 'hero_01', auth.value, {
    database,
    client: server.client,
    autoSave: false,
  });
  controllers.push(controller);
  await controller.loaded;
  server.change('Remote update');
  delay = true;
  const refresh = controller.refresh();
  await started;
  const editing = controller.sheet.update((char) => ({ ...char, notes: 'Typing during refresh' }));
  await vi.waitFor(() => expect(controller.snapshot().notes).toBe('Typing during refresh'));
  resume();
  await Promise.all([refresh, editing]);
  expect(controller.snapshot().notes).toBe('Typing during refresh');
  expect((await readDb(accountKey('owner-A', 'hero_01'), sheetDatabase)).character.notes).toBe(
    'Typing during refresh',
  );
  expect(get(controller.status).phase).toBe('dirty');
});

it('preserves conflicts between two independent browser caches sharing one account', async () => {
  const secondDatabase = createStore('bwo-second-device-test', 'keyval');
  await clear(secondDatabase);
  const server = service();
  const first = open(session(), server);
  const second = createAccountSheet('owner-A', 'hero_01', session().value, {
    client: server.client,
    database: secondDatabase,
    autoSave: false,
  });
  controllers.push(second);
  await Promise.all([first.loaded, second.loaded]);
  await first.sheet.update((char) => ({ ...char, notes: 'First device' }));
  await first.flush();
  await second.sheet.update((char) => ({ ...char, notes: 'Second device' }));
  await second.flush();
  expect(server.remote()?.data.character.notes).toBe('First device');
  expect(get(second.status).phase).toBe('conflict');
  expect((await readDb(accountKey('owner-A', 'hero_01'), secondDatabase)).character.notes).toBe(
    'Second device',
  );
  await second.resolve('replace', await second.review());
  expect(server.remote()?.data.character.notes).toBe('Second device');
  await first.sheet.update((char) => ({ ...char, notes: 'First device continued offline' }));
  await first.flush();
  expect(get(first.status).phase).toBe('conflict');
  expect(first.snapshot().notes).toBe('First device continued offline');
  expect(server.remote()?.data.character.notes).toBe('Second device');
  await clear(secondDatabase);
});
