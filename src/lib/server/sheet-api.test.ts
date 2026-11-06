import { expect, it, vi } from 'vitest';
import type { RequestEvent } from '@sveltejs/kit';
import { handle } from '../../hooks.server';
import { GET as list, POST as create } from '../../routes/api/characters/+server';
import {
  GET as get,
  PUT as update,
  DELETE as remove,
} from '../../routes/api/characters/[id]/+server';
import { authService, event, storeService, access } from './test-fixtures';
import fixture from '../data/sheet-format/fixtures/sheet-v1.json';
import type { SheetDocumentV1 } from '../data/sheet-format/types';

const sheet = () => structuredClone(fixture) as SheetDocumentV1;
async function request(
  path: string,
  method = 'GET',
  body?: unknown,
  store = storeService(),
  owner = 'owner-A',
) {
  const auth = authService();
  auth.verifySession.mockResolvedValue({
    valid: true,
    user: { id: owner, isAnonymous: false, displayName: 'Owner' },
    access: access(),
    permissions: new Set(),
  });
  const ev = event(path, { auth, store, method, body, token: 'verified-cookie' });
  const handler =
    method === 'POST'
      ? create
      : method === 'PUT'
        ? update
        : method === 'DELETE'
          ? remove
          : path.split('?')[0] === '/api/characters'
            ? list
            : get;
  const response = await handle({ event: ev, resolve: () => handler(ev as any) } as Parameters<
    typeof handle
  >[0]);
  return { response, ev, store, body: await response.json() };
}
it('create binds ownership to the verified account and derives portable metadata', async () => {
  const { response, body, store } = await request('/api/characters', 'POST', { sheet: sheet() });
  expect(response.status).toBe(201);
  expect(body).toMatchObject({ ok: true, version: 1 });
  expect(store.create).toHaveBeenCalledWith({ userId: 'owner-A' }, 'pc', 'hero_01', sheet(), {
    formatVersion: 1,
    name: 'Mara',
    calling: 'Lantern Keeper',
    createdAt: null,
  });
});
it('rejects client-selected ownership and metadata before calling storage', async () => {
  for (const extra of [{ userId: 'owner-B' }, { appId: 'parallax' }, { meta: { name: 'Fake' } }]) {
    const { response, store } = await request('/api/characters', 'POST', {
      sheet: sheet(),
      ...extra,
    });
    expect(response.status).toBe(400);
    expect(store.create).not.toHaveBeenCalled();
  }
});
it('paginates with a validated cursor and never lists a caller-selected account', async () => {
  const cursor = { updatedAt: 20, docId: 'next' };
  const { response, store } = await request(
    `/api/characters?userId=owner-B&limit=25&cursor=${encodeURIComponent(JSON.stringify(cursor))}`,
  );
  expect(response.status).toBe(200);
  expect(store.list).toHaveBeenCalledWith({ userId: 'owner-A' }, 'pc', { limit: 25, cursor });
});
it.each([
  'limit=0',
  'limit=101',
  'limit=1.5',
  'cursor=garbage',
  'cursor=%7B%22docId%22%3A%22bad%2Fid%22%2C%22updatedAt%22%3A0%7D',
])('rejects invalid pagination %s', async (query) => {
  const { response, store } = await request(`/api/characters?${query}`);
  expect(response.status).toBe(400);
  expect(store.list).not.toHaveBeenCalled();
});
it('isolates identical sheet IDs in separate accounts', async () => {
  const store = storeService();
  await request('/api/characters/hero_01', 'GET', undefined, store, 'owner-A');
  await request('/api/characters/hero_01', 'GET', undefined, store, 'owner-B');
  expect(store.get.mock.calls).toEqual([
    [{ userId: 'owner-A' }, 'pc', 'hero_01'],
    [{ userId: 'owner-B' }, 'pc', 'hero_01'],
  ]);
});
it('returns a versioned sheet and an explicit not-found result', async () => {
  const store = storeService();
  store.get.mockResolvedValueOnce({
    found: true,
    doc: { docId: 'hero_01', data: sheet(), meta: null, version: 7, createdAt: 1, updatedAt: 2 },
  } as any);
  const found = await request('/api/characters/hero_01', 'GET', undefined, store);
  expect(found.response.status).toBe(200);
  expect(found.body.sheet.version).toBe(7);
  const missing = await request('/api/characters/hero_01');
  expect(missing.response.status).toBe(404);
  expect(missing.body.error).toBe('not_found');
});
it('requires the caller storage version and matching document ID for updates', async () => {
  const good = await request('/api/characters/hero_01', 'PUT', { sheet: sheet(), version: 3 });
  expect(good.response.status).toBe(200);
  expect(good.store.update).toHaveBeenCalledWith(
    { userId: 'owner-A' },
    'pc',
    'hero_01',
    sheet(),
    3,
    expect.any(Object),
  );
  for (const version of [undefined, 0, -1, 1.5, '1']) {
    const invalid = await request('/api/characters/hero_01', 'PUT', { sheet: sheet(), version });
    expect(invalid.response.status).toBe(400);
    expect(invalid.store.update).not.toHaveBeenCalled();
  }
  expect(
    (await request('/api/characters/other', 'PUT', { sheet: sheet(), version: 1 })).response.status,
  ).toBe(400);
});
it('surfaces conflicts without reading a new version or retrying the write', async () => {
  const store = storeService();
  store.update.mockResolvedValue({ ok: false, reason: 'conflict', currentVersion: 9 } as any);
  const { response, body } = await request(
    '/api/characters/hero_01',
    'PUT',
    { sheet: sheet(), version: 3 },
    store,
  );
  expect(response.status).toBe(409);
  expect(body).toEqual({ error: 'conflict', currentVersion: 9 });
  expect(store.update).toHaveBeenCalledOnce();
  expect(store.get).not.toHaveBeenCalled();
});
it.each([
  ['exists', 409],
  ['quota_exceeded', 507],
  ['not_found', 404],
] as const)('maps the %s storage outcome explicitly', async (reason, status) => {
  const store = storeService();
  store.create.mockResolvedValue({ ok: false, reason } as any);
  expect(
    (await request('/api/characters', 'POST', { sheet: sheet() }, store)).response.status,
  ).toBe(status);
});
it('deletes with an explicit current version, preserving conflict/not-found outcomes', async () => {
  const store = storeService();
  const good = await request('/api/characters/hero_01', 'DELETE', { version: 4 }, store);
  expect(good.response.status).toBe(200);
  expect(store.delete).toHaveBeenCalledWith({ userId: 'owner-A' }, 'pc', 'hero_01', 4);
  store.delete.mockResolvedValueOnce({ ok: false, reason: 'conflict', currentVersion: 5 } as any);
  expect(
    (await request('/api/characters/hero_01', 'DELETE', { version: 4 }, store)).response.status,
  ).toBe(409);
  expect((await request('/api/characters/hero_01', 'DELETE', {})).response.status).toBe(400);
});
it('rejects invalid/future/private sheet data and unsupported local attachments without writes', async () => {
  for (const value of [
    { ...sheet(), version: 2 },
    { ...sheet(), settings: { discordWebhook: 'fake-secret' } },
    {
      ...sheet(),
      character: {
        ...sheet().character,
        equipment: [
          { id: 'item', name: 'Item', image: { kind: 'bundle-asset', assetId: 'image_01' } },
        ],
      },
    },
    { ...sheet(), character: { ...sheet().character, notes: 'x'.repeat(513 * 1024) } },
  ]) {
    const { response, store } = await request('/api/characters', 'POST', { sheet: value });
    expect([400, 413, 422]).toContain(response.status);
    expect(store.create).not.toHaveBeenCalled();
  }
});
it('rejects malformed JSON and cross-origin or non-JSON mutations', async () => {
  for (const options of [
    { rawBody: '{' },
    { body: { sheet: sheet() }, headers: { 'Content-Type': 'text/plain' } },
    { body: { sheet: sheet() }, requestOrigin: 'https://evil.test' },
  ]) {
    const store = storeService();
    const ev = event('/api/characters', {
      auth: authService(),
      store,
      token: 'old',
      method: 'POST',
      ...options,
    });
    const response = await handle({ event: ev, resolve: () => create(ev as any) } as Parameters<
      typeof handle
    >[0]);
    expect([400, 403, 415]).toContain(response.status);
    expect(store.create).not.toHaveBeenCalled();
  }
});
it('requires a signed-in account and healthy configured services before storage operations', async () => {
  const cases = [
    event('/api/characters', { store: storeService() }),
    event('/api/characters', { auth: authService(), store: storeService() }),
    event('/api/characters', { auth: authService(), token: 'old' }),
  ];
  const guest = authService();
  guest.verifySession.mockResolvedValue({
    valid: true,
    user: { id: 'anon', isAnonymous: true, displayName: '' },
    access: access(),
    permissions: new Set(),
  });
  cases.push(event('/api/characters', { auth: guest, store: storeService(), token: 'guest' }));
  for (const ev of cases) {
    const response = await handle({ event: ev, resolve: () => list(ev as any) } as Parameters<
      typeof handle
    >[0]);
    expect([401, 503]).toContain(response.status);
    if (ev.platform?.env.STORE) expect(ev.platform.env.STORE.list).not.toHaveBeenCalled();
  }
});
it('returns retryable errors without leaking RPC details or claiming an empty library', async () => {
  const store = storeService();
  store.list.mockRejectedValue(new Error('private database details'));
  const { response, body } = await request('/api/characters', 'GET', undefined, store);
  expect(response.status).toBe(503);
  expect(body).toMatchObject({ error: 'storage_unavailable' });
  expect(JSON.stringify(body)).not.toContain('private database');
  expect(response.headers.get('Cache-Control')).toBe('no-store');
});
