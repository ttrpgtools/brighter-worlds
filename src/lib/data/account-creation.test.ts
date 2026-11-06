import 'fake-indexeddb/auto';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { clear, entries, get as read, set } from 'idb-keyval';
import { writable, get } from 'svelte/store';
import { createAccountCharacters, newCharacter, saveCachedCompanions } from './account-creation';
import { accountKey } from './account-persistence';
import { sheetDatabase } from './storage-transaction';
import type { AccountSession } from './account-session';
import fixture from './sheet-format/fixtures/sheet-v1.json';
import { hydrateSheet } from './sheet-format/codec';
import type { SheetDocumentV1 } from './sheet-format/types';
beforeEach(() => clear(sheetDatabase));
afterEach(() => vi.unstubAllGlobals());
function setup() {
  const state = writable({
    account: { user: { id: 'owner-A', displayName: 'A' }, allowed: true, state: 'authenticated' },
    epoch: 1,
  });
  const session = {
    subscribe: state.subscribe,
    current: () => get(state),
    refresh: async () => {},
  } as AccountSession;
  const root = newCharacter(
    hydrateSheet(
      structuredClone(fixture) as SheetDocumentV1,
      new Map(),
      new Map(),
      new Set(['pip_01']),
    ),
    'hero_01',
  );
  const companion = newCharacter({ ...root, name: 'Pip', abilities: [] }, 'pip_01');
  return {
    root,
    companion,
    session,
    change: () =>
      state.set({
        account: {
          user: { id: 'owner-B', displayName: 'B' },
          allowed: true,
          state: 'authenticated',
        },
        epoch: 2,
      }),
  };
}
it('creates one durable account group without creating duplicate local characters or contacting the network', async () => {
  const api = setup();
  const fetcher = vi.fn();
  vi.stubGlobal('fetch', fetcher);
  const href = await createAccountCharacters('owner-A', api.root, [api.companion], api.session);
  expect(href).toBe('/character/hero_01?account=owner-A');
  expect(fetcher).not.toHaveBeenCalled();
  const rows = await entries<string, any>(sheetDatabase);
  expect(rows).toHaveLength(2);
  expect(rows.every(([key]) => key.startsWith('bw-document:v1:account:owner-A:'))).toBe(true);
  expect(
    rows.every(
      ([, value]) => value.revision === 0 && value.savedRevision === -1 && !value.remoteVersion,
    ),
  ).toBe(true);
  expect(
    (await read(accountKey('owner-A', 'hero_01'), sheetDatabase)).character.statuses,
  ).toBeInstanceOf(Set);
});
it('rejects an account change or missing companion before storing the creation group', async () => {
  const api = setup();
  await expect(createAccountCharacters('owner-A', api.root, [], api.session)).rejects.toThrow(
    'companion',
  );
  api.change();
  await expect(
    createAccountCharacters('owner-A', api.root, [api.companion], api.session),
  ).rejects.toThrow('account changed');
  expect(await entries(sheetDatabase)).toEqual([]);
});
it('rolls back the entire new group on a cache collision without replacing the existing draft', async () => {
  const api = setup();
  await set(accountKey('owner-A', 'pip_01'), { sentinel: 'Existing draft' }, sheetDatabase);
  await expect(
    createAccountCharacters('owner-A', api.root, [api.companion], api.session),
  ).rejects.toThrow('already exists');
  expect(await read(accountKey('owner-A', 'hero_01'), sheetDatabase)).toBeUndefined();
  expect(await read(accountKey('owner-A', 'pip_01'), sheetDatabase)).toEqual({
    sentinel: 'Existing draft',
  });
});
it('saves newly created companion drafts through the versioned queue while leaving the root for its open controller', async () => {
  const api = setup();
  await createAccountCharacters('owner-A', api.root, [api.companion], api.session);
  let remote: any;
  vi.stubGlobal(
    'fetch',
    vi.fn(async (_url: string, options: RequestInit = {}) => {
      if ((options.method ?? 'GET') === 'GET')
        return remote
          ? Response.json({ sheet: remote })
          : Response.json({ error: 'not_found' }, { status: 404 });
      const document = JSON.parse(options.body as string).sheet;
      expect(document.id).toBe('pip_01');
      remote = { data: document, docId: document.id, version: 1, createdAt: 1, updatedAt: 1 };
      return Response.json({ version: 1, updatedAt: 1 });
    }),
  );
  expect(await saveCachedCompanions('owner-A', 'hero_01', api.session)).toEqual([]);
  expect((await read(accountKey('owner-A', 'pip_01'), sheetDatabase)).savedRevision).toBe(0);
  expect((await read(accountKey('owner-A', 'hero_01'), sheetDatabase)).savedRevision).toBe(-1);
});
it('keeps offline companion drafts durable and reports incomplete group saving', async () => {
  const api = setup();
  await createAccountCharacters('owner-A', api.root, [api.companion], api.session);
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => {
      throw new Error('Offline');
    }),
  );
  expect(await saveCachedCompanions('owner-A', 'hero_01', api.session)).toEqual(['Pip']);
  expect((await read(accountKey('owner-A', 'pip_01'), sheetDatabase)).character.name).toBe('Pip');
  expect((await read(accountKey('owner-A', 'pip_01'), sheetDatabase)).savedRevision).toBe(-1);
});
