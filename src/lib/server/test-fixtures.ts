import type { RequestEvent } from '@sveltejs/kit';
import { vi } from 'vitest';
import type { AnkhService, AppAccessDecision, CookieInstructions } from './ankh';
import type { AegisService } from './aegis';
const cookieModule = new URL(
  '../../../node_modules/@sveltejs/kit/src/runtime/server/cookie.js',
  import.meta.url,
);
const { get_cookies } = await import(/* @vite-ignore */ cookieModule.href);
export const access = (overrides: Partial<AppAccessDecision> = {}): AppAccessDecision => ({
  appId: 'bwo',
  allowed: true,
  policy: 'open',
  reason: 'account',
  checkedAt: Date.now(),
  recheckAt: Date.now() + 60000,
  ...overrides,
});
export const cookie = (value = 'rotated-test-token'): CookieInstructions => ({
  method: 'set',
  name: 'ankh-session',
  value,
  options: { path: '/', httpOnly: true, sameSite: 'lax', maxAge: 3600, domain: '.ttrpg.tools' },
});
export function authService() {
  return {
    getSessionCookieName: vi.fn(async () => 'ankh-session'),
    verifySession: vi.fn(async () => ({
      valid: true as const,
      user: { id: 'owner-A', isAnonymous: false, displayName: 'Alice' },
      access: access(),
      permissions: new Set<string>(),
    })),
    createAnonymousSession: vi.fn(async () => ({
      user: { id: 'anon', isAnonymous: true },
      cookie: cookie('anonymous-test-token'),
    })),
    createLoginTicket: vi.fn(async () => 'login-ticket'),
    createSignupTicket: vi.fn(async () => 'signup-ticket'),
    createLogoutTicket: vi.fn(async () => 'logout-ticket'),
    redeemLoginCompletion: vi.fn(async () => ({ cookie: cookie() })),
  };
}
export function storeService() {
  return {
    get: vi.fn(async () => ({ found: false as const })),
    list: vi.fn(async () => ({ items: [], nextCursor: null })),
    create: vi.fn(async () => ({ ok: true as const, version: 1, createdAt: 1, updatedAt: 1 })),
    update: vi.fn(async () => ({ ok: true as const, version: 2, updatedAt: 2 })),
    delete: vi.fn(async () => ({ ok: true as const })),
  };
}
export function event(
  path = '/character',
  options: {
    auth?: AnkhService;
    store?: AegisService;
    token?: string;
    method?: string;
    body?: unknown;
    rawBody?: string;
    origin?: string;
    requestOrigin?: string;
    headers?: Record<string, string>;
  } = {},
) {
  const url = new URL(path, options.origin ?? 'https://brighterworlds.app');
  const method = options.method ?? 'GET';
  const request = new Request(url, {
    method,
    headers: {
      ...(options.token ? { Cookie: `ankh-session=${options.token}` } : {}),
      ...(options.body !== undefined || options.rawBody !== undefined
        ? { 'Content-Type': 'application/json' }
        : {}),
      ...(options.requestOrigin ? { Origin: options.requestOrigin } : {}),
      ...options.headers,
    },
    ...(options.body !== undefined ? { body: JSON.stringify(options.body) } : {}),
    ...(options.rawBody !== undefined ? { body: options.rawBody } : {}),
  });
  const { cookies, set_trailing_slash } = get_cookies(request, url);
  set_trailing_slash('never');
  return {
    request,
    url,
    cookies,
    params: { id: url.pathname.split('/').at(-1) },
    locals: { permissions: new Set<string>() },
    platform: { env: { AUTH: options.auth, STORE: options.store } },
    isDataRequest: false,
    setHeaders: () => {},
  } as unknown as RequestEvent;
}
