import { expect, it, vi } from 'vitest';
import { json, type RequestEvent } from '@sveltejs/kit';
import { handle } from '../../hooks.server';
import { GET as session } from '../../routes/api/session/+server';
import {
  createAnkhRedirect,
  redeemAnkhCompletion,
  createAnkhLogoutRedirect,
  getAnkhResponse,
  normalizeLocalReturnTo,
  requireAccount,
  applicationAccessFailure,
} from './ankh';
import { access, authService, cookie, event, storeService } from './test-fixtures';

async function run(
  ev: RequestEvent,
  resolve: () => Promise<Response> = vi.fn(async () => new Response('local sheets')),
) {
  return handle({ event: ev, resolve } as Parameters<typeof handle>[0]);
}

it.each([
  '/character',
  '/character/hero',
  '/character/obtain?item=test',
  '/gm',
  '/account',
  '/access',
])('keeps %s available without services or identity', async (path) => {
  const ev = event(path);
  const resolve = vi.fn(async () => new Response('local sheets'));
  const response = await run(ev, resolve);
  expect(response.status).toBe(200);
  expect(await response.text()).toBe('local sheets');
  expect(resolve).toHaveBeenCalledOnce();
});
it('does not create anonymous sessions for ordinary local use', async () => {
  const auth = authService();
  const ev = event('/character', { auth });
  expect((await run(ev)).status).toBe(200);
  expect(auth.createAnonymousSession).not.toHaveBeenCalled();
  expect(auth.verifySession).not.toHaveBeenCalled();
  expect(auth.getSessionCookieName).not.toHaveBeenCalled();
  expect(ev.locals.authState).toBe('signed-out');
});
it('keeps local pages available during an auth outage while account APIs fail closed', async () => {
  const auth = authService();
  auth.verifySession.mockRejectedValue(new Error('internal secret test sentinel'));
  const local = event('/character', { auth, token: 'old' });
  expect((await run(local)).status).toBe(200);
  const resolve = vi.fn(async () => new Response('protected'));
  const response = await run(event('/api/characters', { auth, token: 'old' }), resolve);
  expect(response.status).toBe(503);
  expect(resolve).not.toHaveBeenCalled();
  expect(await response.text()).not.toContain('internal secret');
  expect(response.headers.get('Retry-After')).toBe('5');
  expect(auth.createAnonymousSession).not.toHaveBeenCalled();
});
it('returns 401 for tokenless account API calls without creating identity', async () => {
  const auth = authService();
  const resolve = vi.fn();
  const response = await run(event('/api/characters', { auth }), resolve);
  expect(response.status).toBe(401);
  expect(resolve).not.toHaveBeenCalled();
  expect(auth.createAnonymousSession).not.toHaveBeenCalled();
});
it.each([{ appId: 'keeperscall' }, { recheckAt: Date.now() - 1 }])(
  'fails closed on foreign or stale access: %j',
  async (overrides) => {
    const auth = authService();
    auth.verifySession.mockResolvedValue({
      valid: true,
      user: { id: 'owner-A', isAnonymous: false, displayName: 'Alice' },
      access: access(overrides),
      permissions: new Set(),
    });
    const resolve = vi.fn();
    const response = await run(event('/api/characters', { auth, token: 'old' }), resolve);
    expect(response.status).toBe(503);
    expect(resolve).not.toHaveBeenCalled();
  },
);
it('fails closed on a missing access contract', async () => {
  expect(applicationAccessFailure(undefined)?.status).toBe(503);
  const auth = authService();
  auth.verifySession.mockResolvedValue({
    valid: true,
    user: { id: 'owner-A', isAnonymous: false, displayName: 'Alice' },
    permissions: new Set(),
  } as any);
  expect((await run(event('/api/characters', { auth, token: 'old' }))).status).toBe(503);
});
it.each(['invitation_required', 'access_denied', 'grant_expired'] as const)(
  'enforces %s, retains identity and applies rotated host-only cookies on a denial',
  async (reason) => {
    const auth = authService();
    auth.verifySession.mockResolvedValue({
      valid: true,
      user: { id: 'owner-A', isAnonymous: false, displayName: 'Alice' },
      access: access({ allowed: false, reason }),
      permissions: new Set(),
      cookie: cookie(),
    } as any);
    const ev = event('/api/characters', { auth, token: 'old' });
    const response = await run(ev, vi.fn());
    expect(response.status).toBe(403);
    expect(ev.locals.user?.id).toBe('owner-A');
    const header = response.headers.get('Set-Cookie');
    expect(header).toContain('rotated-test-token');
    expect(header).toContain('HttpOnly');
    expect(header).toContain('Secure');
    expect(header).not.toContain('Domain=');
    expect(auth.createAnonymousSession).not.toHaveBeenCalled();
  },
);
it('rechecks changed access on every protected request', async () => {
  const auth = authService();
  const ev = () => event('/api/characters', { auth, token: 'old' });
  expect((await run(ev())).status).toBe(200);
  auth.verifySession.mockImplementation(async () => ({
    valid: true,
    user: { id: 'owner-A', isAnonymous: false, displayName: 'Alice' },
    access: access({ allowed: false, reason: 'access_denied' }),
    permissions: new Set(),
  }));
  expect((await run(ev())).status).toBe(403);
  expect(auth.verifySession).toHaveBeenCalledTimes(2);
});
it.each(['https://brighterworlds.app', 'https://dev.brighterworlds.app', 'http://bwo.localhost'])(
  'uses ticket login/signup and exact originating URL at %s',
  async (origin) => {
    for (const kind of ['login', 'signup'] as const) {
      const auth = authService();
      const ev = event(`/auth/${kind}?returnTo=%2Fcharacter%2Fhero%3Fx%3D1`, { auth, origin });
      await expect(createAnkhRedirect(ev, kind)).rejects.toMatchObject({
        status: 303,
        location: expect.stringContaining(`/${kind}?ticket=`),
      });
      expect(
        kind === 'login' ? auth.createLoginTicket : auth.createSignupTicket,
      ).toHaveBeenCalledWith('anonymous-test-token', `${origin}/character/hero?x=1`);
    }
  },
);
it.each([
  'https://evil.test/secret',
  '//evil.test',
  '/\\evil.test',
  '/auth/login',
  '/api/characters',
])('normalizes unsafe return target %s', (returnTo) => {
  expect(normalizeLocalReturnTo(event(), returnTo)).toBe('/character');
});
it('retries only one empty ticket, and never retries an RPC failure', async () => {
  const auth = authService();
  auth.createLoginTicket.mockResolvedValueOnce('');
  await expect(
    createAnkhRedirect(event('/auth/login', { auth, token: 'expired' }), 'login'),
  ).rejects.toMatchObject({ status: 303 });
  expect(auth.createAnonymousSession).toHaveBeenCalledOnce();
  expect(auth.createLoginTicket).toHaveBeenCalledTimes(2);
  const failed = authService();
  failed.createLoginTicket.mockRejectedValue(new Error('rate limited'));
  await expect(
    createAnkhRedirect(event('/auth/login', { auth: failed, token: 'old' }), 'login'),
  ).rejects.toMatchObject({ status: 503 });
  expect(failed.createLoginTicket).toHaveBeenCalledOnce();
  expect(failed.createAnonymousSession).not.toHaveBeenCalled();
});
it('rejects sign-in from an unregistered preview origin', async () => {
  const auth = authService();
  await expect(
    createAnkhRedirect(
      event('/auth/login', { auth, origin: 'https://preview.pages.dev' }),
      'login',
    ),
  ).rejects.toMatchObject({ status: 400 });
  expect(auth.createAnonymousSession).not.toHaveBeenCalled();
});
it('redeems completion before verification, rotates the cookie and redirects to a clean URL', async () => {
  const auth = authService();
  const ev = event('/character/hero?x=1&ankh_login=one-use', { auth, token: 'old' });
  const response = await run(ev);
  expect(response.status).toBe(303);
  expect(response.headers.get('Location')).toBe('/character/hero?x=1');
  expect(response.headers.get('Set-Cookie')).toContain('rotated-test-token');
  expect(response.headers.get('Referrer-Policy')).toBe('no-referrer');
  expect(auth.redeemLoginCompletion).toHaveBeenCalledWith('old', 'one-use');
  expect(auth.verifySession).not.toHaveBeenCalled();
});
it('preserves cookie/code for an idempotent redemption retry on RPC failure', async () => {
  const auth = authService();
  auth.redeemLoginCompletion.mockRejectedValue(new Error('lost response'));
  const ev = event('/character?ankh_login=one-use', { auth, token: 'old' });
  const response = await run(ev);
  expect(response.status).toBe(503);
  expect(ev.cookies.get('ankh-session')).toBe('old');
  expect(ev.url.searchParams.get('ankh_login')).toBe('one-use');
  expect(auth.verifySession).not.toHaveBeenCalled();
});
it('handles missing/invalid completion without granting access', async () => {
  const auth = authService();
  await expect(
    redeemAnkhCompletion(event('/account?ankh_login=bad', { auth })),
  ).rejects.toMatchObject({ status: 303, location: expect.stringContaining('/auth/login?') });
  auth.redeemLoginCompletion.mockResolvedValue(null as any);
  const ev = event('/account?ankh_login=bad', { auth, token: 'old' });
  await expect(redeemAnkhCompletion(ev)).rejects.toMatchObject({ status: 303 });
  expect(ev.cookies.get('ankh-session')).toBeUndefined();
});
it('allows a denied account to start auth or sign out without a verification loop', async () => {
  const auth = authService();
  const ev = event('/auth/logout', { auth, method: 'POST', token: 'old' });
  const response = await run(ev, async () => createAnkhLogoutRedirect(ev));
  expect(response.status).toBe(303);
  expect(auth.createLogoutTicket).toHaveBeenCalledWith('old', 'https://brighterworlds.app/account');
  expect(ev.cookies.get('ankh-session')).toBeUndefined();
  expect(auth.verifySession).not.toHaveBeenCalled();
});
it('rejects cross-origin logout', async () => {
  const auth = authService();
  await expect(
    createAnkhLogoutRedirect(
      event('/auth/logout', {
        auth,
        method: 'POST',
        token: 'old',
        requestOrigin: 'https://evil.test',
      }),
    ),
  ).rejects.toMatchObject({ status: 403 });
  expect(auth.createLogoutTicket).not.toHaveBeenCalled();
});
it('applies invalid-session deletion instructions and exposes no raw session data', async () => {
  const auth = authService();
  auth.verifySession.mockResolvedValue({
    valid: false,
    permissions: new Set(),
    cookie: { ...cookie(), method: 'delete' },
  } as any);
  const ev = event('/api/session', { auth, token: 'old', store: storeService() });
  await getAnkhResponse(ev);
  expect(ev.cookies.get('ankh-session')).toBeUndefined();
  const response = await session(ev as any);
  const text = await response.text();
  expect(text).not.toContain('old');
  expect(text).not.toContain('rotated-test-token');
  expect(JSON.parse(text).user).toBeNull();
  expect(() => requireAccount(ev)).toThrow();
});
it('retains SvelteKit redirect protocol on data requests', async () => {
  const ev = event('/account?ankh_login=code', { auth: authService(), token: 'old' });
  ev.isDataRequest = true;
  const response = await run(ev);
  expect(await response.json()).toEqual({ type: 'redirect', location: '/account' });
  expect(response.headers.get('Set-Cookie')).toContain('rotated-test-token');
});

it.each([true, false])(
  'the shared account menu can read its current profile when application access is %s, without session secrets',
  async (allowed) => {
    const auth = authService();
    auth.verifySession.mockResolvedValue({
      valid: true,
      user: {
        id: 'owner-A',
        isAnonymous: false,
        displayName: 'Alice',
        email: 'alice@example.invalid',
        avatar: 'https://images.example.invalid/alice.webp',
        externalId: 'private-provider-id',
      },
      access: access({ allowed, reason: allowed ? 'account' : 'access_denied' }),
      permissions: new Set(['private-permission']),
      data: { webhook: 'private-app-data' },
      cookie: cookie('private-rotated-token'),
    } as any);
    const ev = event('/api/session', { auth, token: 'private-old-token', store: storeService() });
    const response = await run(ev, async () => session(ev as any));
    expect(response.status).toBe(200);
    expect(response.headers.get('Cache-Control')).toBe('no-store');
    const body = await response.json();
    expect(body.user).toEqual({
      id: 'owner-A',
      displayName: 'Alice',
      email: 'alice@example.invalid',
      avatar: 'https://images.example.invalid/alice.webp',
    });
    expect(body.allowed).toBe(allowed);
    const text = JSON.stringify(body);
    for (const secret of [
      'private-provider-id',
      'private-permission',
      'private-app-data',
      'private-rotated-token',
      'private-old-token',
    ])
      expect(text).not.toContain(secret);
  },
);
