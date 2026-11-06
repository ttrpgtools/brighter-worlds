import 'fake-indexeddb/auto';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { clear, entries, get as readDb, set as writeDb } from 'idb-keyval';
import { writable, get } from 'svelte/store';
import fixture from './sheet-format/fixtures/bundle-v1.json';
import { saveOnlineSelection, type OnlineSelection } from './account-transfer';
import { reconcileLocalPromotions, readPromotion } from './account-promotion';
import { hydrateSheet } from './sheet-format/codec';
import { accountKey } from './account-persistence';
import { sheetDatabase } from './storage-transaction';
import type { AccountSession } from './account-session';
import type { SheetDocumentV1 } from './sheet-format/types';
import type { AegisDoc } from '$lib/server/aegis';

beforeEach(async () => {
  await clear(sheetDatabase);
});
afterEach(() => vi.unstubAllGlobals());

it('rejects a transfer prepared for another account before reading or writing sheets', async () => {
  const { session } = setup();
  await expect(
    saveOnlineSelection(selection(), session, { expectedOwner: 'another-account' }),
  ).rejects.toMatchObject({ code: 'account_changed' });
  expect(fetch).not.toHaveBeenCalled();
  expect(await entries(sheetDatabase)).toEqual([]);
});
function selection(): OnlineSelection {
  const bundle = structuredClone(fixture) as OnlineSelection['bundle'];
  bundle.assets = [];
  function urls(value: any) {
    if (Array.isArray(value)) value.forEach(urls);
    else if (value && typeof value === 'object') {
      if (value.kind === 'bundle-asset') {
        delete value.assetId;
        value.kind = 'url';
        value.url = 'https://example.invalid/image.png';
      } else Object.values(value).forEach(urls);
    }
  }
  urls(bundle.sheets);
  return {
    bundle,
    warnings: [],
    settings: new Map([
      [
        bundle.roots[0],
        { rollToBridge: true, rollToDiscord: true, discordWebhook: 'private-hook-sentinel' },
      ],
    ]),
  };
}
function setup() {
  const owner = 'account-A';
  const state = writable({
    account: {
      state: 'authenticated',
      user: { id: owner, displayName: 'Alice' },
      allowed: true,
      storageConfigured: true,
      accessUnavailable: false,
      accountUrl: 'https://ankh.example.invalid',
    } as any,
    epoch: 1,
  });
  const session = {
    subscribe: state.subscribe,
    current: () => get(state),
    refresh: async () => {},
  } as AccountSession;
  const docs = new Map<string, AegisDoc>();
  let rejectId: string | undefined;
  const creates: string[] = [];
  const bodies: unknown[] = [];
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: string, options: RequestInit = {}) => {
      const headers = new Headers(options.headers);
      expect(headers.get('X-Brighter-Worlds-Owner')).toBe(owner);
      const path = new URL(input, 'https://brighterworlds.app').pathname;
      const id = decodeURIComponent(path.split('/').at(-1)!);
      if ((options.method ?? 'GET') === 'GET')
        return docs.has(id)
          ? Response.json({ sheet: docs.get(id) })
          : Response.json({ error: 'not_found' }, { status: 404 });
      const body = JSON.parse(options.body as string);
      bodies.push(body);
      if (options.method === 'POST') {
        const data = body.sheet as SheetDocumentV1;
        creates.push(data.id);
        if (data.id === rejectId) return Response.json({ error: 'storage_quota' }, { status: 507 });
        if (docs.has(data.id)) return Response.json({ error: 'exists' }, { status: 409 });
        docs.set(data.id, {
          docId: data.id,
          data: structuredClone(data),
          meta: null,
          version: 1,
          createdAt: 1,
          updatedAt: 1,
        });
        return Response.json({ ok: true, version: 1, updatedAt: 1 }, { status: 201 });
      }
      throw new Error('Unexpected mutation');
    }),
  );
  return {
    owner,
    session,
    docs,
    creates,
    bodies,
    reject: (id?: string) => {
      rejectId = id;
    },
  };
}
it('saves linked companions without sensitive settings and reuses the transfer receipt on retry', async () => {
  const api = setup();
  const input = selection();
  const first = await saveOnlineSelection(input, api.session);
  expect(first.outcomes.every((x) => x.phase === 'saved')).toBe(true);
  expect(api.docs.size).toBe(2);
  expect(JSON.stringify(api.bodies)).not.toContain('private-hook-sentinel');
  const root = api.docs.get(input.bundle.roots[0])!;
  expect(api.docs.has(root.data.relations[0].sheetId)).toBe(true);
  expect(
    (await readDb(accountKey(api.owner, root.docId), sheetDatabase)).character.settings
      .discordWebhook,
  ).toBe('private-hook-sentinel');
  await saveOnlineSelection(input, api.session);
  expect(api.creates).toHaveLength(2);
});
it('copies the entire graph when an existing account ID differs and never overwrites it', async () => {
  const api = setup();
  const input = selection();
  const root = input.bundle.sheets[0];
  api.docs.set(root.id, {
    docId: root.id,
    data: { ...root, character: { ...root.character, notes: 'Existing account copy' } },
    meta: null,
    version: 9,
    createdAt: 1,
    updatedAt: 1,
  });
  const result = await saveOnlineSelection(input, api.session);
  expect(result.copied).toBe(true);
  expect(result.outcomes.every((x) => x.id !== x.original)).toBe(true);
  const mapped = new Map(result.outcomes.map((x) => [x.original, x.id]));
  expect(api.docs.get(mapped.get(root.id)!)!.data.relations[0].sheetId).toBe(
    mapped.get(root.relations[0].sheetId),
  );
  expect(api.docs.get(root.id)?.data.character.notes).toBe('Existing account copy');
  await saveOnlineSelection(input, api.session);
  expect(api.creates).toHaveLength(2);
});
it('resumes partial quota failures without duplicating already-saved members', async () => {
  const api = setup();
  const input = selection();
  const child = input.bundle.sheets[1].id;
  api.reject(child);
  const partial = await saveOnlineSelection(input, api.session);
  expect(partial.outcomes.map((x) => x.phase)).toEqual(['saved', 'error']);
  api.reject();
  const retried = await saveOnlineSelection(input, api.session);
  expect(retried.outcomes.every((x) => x.phase === 'saved')).toBe(true);
  expect(api.creates.filter((id) => id === input.bundle.roots[0])).toHaveLength(1);
  expect(api.docs.size).toBe(2);
});
it('never resets later account edits or resurrects a deleted member when retrying a completed transfer', async () => {
  const api = setup();
  const input = selection();
  await saveOnlineSelection(input, api.session);
  const root = api.docs.get(input.bundle.roots[0])!;
  root.version = 2;
  root.data.character.notes = 'Later edit';
  const child = input.bundle.sheets[1].id;
  api.docs.delete(child);
  const retried = await saveOnlineSelection(input, api.session);
  expect(api.docs.get(root.docId)?.data.character.notes).toBe('Later edit');
  expect(api.docs.has(child)).toBe(false);
  expect(retried.outcomes.find((x) => x.id === child)?.phase).toBe('missing');
  expect(api.creates).toHaveLength(2);
});
it('does not issue cloud mutations until the whole receipt and draft group are durable', async () => {
  const api = setup();
  const failWrites: typeof sheetDatabase = (mode, run) =>
    mode === 'readwrite' ? Promise.reject(new Error('disk full')) : sheetDatabase(mode, run);
  await expect(
    saveOnlineSelection(selection(), api.session, { database: failWrites }),
  ).rejects.toThrow('disk full');
  expect(api.creates).toHaveLength(0);
  expect(
    (await entries(sheetDatabase)).filter(([key]) => String(key).startsWith('bw-document:')),
  ).toHaveLength(0);
});
it('rejects unresolved companion and embedded-image transfers before making cloud writes', async () => {
  const api = setup();
  const images = selection();
  images.bundle.assets = structuredClone(fixture.assets) as any;
  await expect(saveOnlineSelection(images, api.session)).rejects.toThrow('embedded images');
  const missing = selection();
  missing.bundle.unresolvedRelations = [
    { sheetId: missing.bundle.roots[0], abilityId: 'a', targetSheetId: 'missing' },
  ];
  await expect(saveOnlineSelection(missing, api.session)).rejects.toThrow('companion');
  expect(api.creates).toHaveLength(0);
});

it('recognizes identical account documents from another origin without duplicating or replacing them', async () => {
  const api = setup();
  const input = selection();
  for (const data of input.bundle.sheets)
    api.docs.set(data.id, {
      docId: data.id,
      data: structuredClone(data),
      meta: null,
      version: 5,
      createdAt: 1,
      updatedAt: 5,
    });
  const result = await saveOnlineSelection(input, api.session);
  expect(result.complete).toBe(true);
  expect(result.copied).toBe(false);
  expect(api.creates).toHaveLength(0);
  expect(result.outcomes.every((item) => item.phase === 'saved')).toBe(true);
});
it('does not call a missing browser draft an applied transfer or recreate it automatically', async () => {
  const api = setup();
  const input = selection();
  await saveOnlineSelection(input, api.session);
  const { removeAccountCache } = await import('./account-persistence');
  await removeAccountCache(api.owner, input.bundle.roots[0]);
  const result = await saveOnlineSelection(input, api.session);
  expect(result.complete).toBe(false);
  expect(result.outcomes[0].phase).toBe('cache-missing');
  expect(api.creates).toHaveLength(2);
});

async function seedLocal(input: OnlineSelection) {
  for (const sheet of input.bundle.sheets)
    await writeDb(
      `bw-sheet-${sheet.id}`,
      hydrateSheet(
        sheet,
        new Map(),
        new Map(),
        new Set(input.bundle.sheets.map((value) => value.id)),
      ),
      sheetDatabase,
    );
}
it('promotes an acknowledged local group into one account identity, archives originals and redirects old IDs', async () => {
  const api = setup();
  const input = selection();
  await seedLocal(input);
  const result = await saveOnlineSelection(input, api.session);
  expect(result.promoted).toBe(true);
  for (const item of result.outcomes) {
    expect(await readDb(`bw-sheet-${item.original}`, sheetDatabase)).toBeUndefined();
    expect(await readPromotion(item.original)).toEqual({ owner: api.owner, id: item.id });
    expect((await readDb(accountKey(api.owner, item.id), sheetDatabase)).character).toBeDefined();
  }
  const archives = (await entries<string, any>(sheetDatabase)).filter(([key]) =>
    key.startsWith('bw-recovery:account:'),
  );
  expect(archives).toHaveLength(2);
  expect(archives[0][1].character.statuses).toBeInstanceOf(Set);
});
it('keeps the entire local group editable until every account member is saved', async () => {
  const api = setup();
  const input = selection();
  await seedLocal(input);
  api.reject(input.bundle.sheets[1].id);
  expect((await saveOnlineSelection(input, api.session)).promoted).toBe(false);
  for (const sheet of input.bundle.sheets)
    expect(await readDb(`bw-sheet-${sheet.id}`, sheetDatabase)).toBeDefined();
  api.reject();
  expect((await saveOnlineSelection(input, api.session)).promoted).toBe(true);
});
it('reconciles earlier copy-style saves only when the receipt proves the local content is unchanged', async () => {
  const api = setup();
  const input = selection();
  await saveOnlineSelection(input, api.session); // old-style receipt without active local records
  await seedLocal(input);
  const root = input.bundle.roots[0];
  const original = await readDb(`bw-sheet-${root}`, sheetDatabase);
  await writeDb(`bw-sheet-${root}`, { ...original, notes: 'New local edits' }, sheetDatabase);
  expect(await reconcileLocalPromotions(api.owner, api.session)).toBe(false);
  expect((await readDb(`bw-sheet-${root}`, sheetDatabase)).notes).toBe('New local edits');
  await writeDb(`bw-sheet-${root}`, original, sheetDatabase);
  expect(await reconcileLocalPromotions(api.owner, api.session)).toBe(true);
  expect(await readDb(`bw-sheet-${root}`, sheetDatabase)).toBeUndefined();
});
