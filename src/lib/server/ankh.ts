import { env } from '$env/dynamic/public';
import { error, isRedirect, redirect, type RequestEvent } from '@sveltejs/kit';
import { ACCOUNT_APP_ID } from '$lib/data/sheet-format/types';

type CookieOptions = NonNullable<Parameters<RequestEvent['cookies']['set']>[2]>;
export type CookieInstructions = {
  method: 'set' | 'delete';
  name: string;
  value: string;
  options: CookieOptions;
};
export interface AnkhUser {
  id: string;
  isAnonymous: boolean;
  email?: string;
  firstName?: string;
  lastName?: string;
  displayName?: string;
  avatar?: string;
}
export interface AppAccessDecision {
  appId: string;
  policy: 'open' | 'account_required' | 'restricted';
  allowed: boolean;
  reason:
    | 'open'
    | 'account'
    | 'granted'
    | 'sign_in_required'
    | 'invitation_required'
    | 'access_denied'
    | 'grant_expired';
  checkedAt: number;
  recheckAt: number;
}
export type VerifyResponse =
  | { valid: false; permissions: Set<string>; cookie?: CookieInstructions }
  | {
      valid: true;
      user: AnkhUser;
      access: AppAccessDecision;
      permissions: Set<string>;
      cookie?: CookieInstructions;
      data?: Record<string, unknown>;
      upgradedFromUserId?: string;
    };
export interface AnkhService {
  getSessionCookieName(): Promise<string>;
  verifySession(token: string): Promise<VerifyResponse>;
  createAnonymousSession(): Promise<{ user: AnkhUser; cookie: CookieInstructions }>;
  createLoginTicket(token: string, returnTo: string): Promise<string>;
  createSignupTicket(token: string, returnTo: string): Promise<string>;
  createLogoutTicket(token: string, returnTo: string): Promise<string>;
  redeemLoginCompletion(
    token: string,
    completion: string,
  ): Promise<{ cookie: CookieInstructions } | null>;
}
export const CONSUMER_ORIGINS = new Set([
  'https://brighterworlds.app',
  'https://dev.brighterworlds.app',
  'http://bwo.localhost',
]);
export function publicAnkh(event: RequestEvent) {
  return event.url.hostname.endsWith('.localhost')
    ? env.PUBLIC_ANKH_LOCAL || 'http://ankh.localhost'
    : env.PUBLIC_ANKH || 'https://ankh.ttrpg.tools';
}
export function applicationAccessFailure(access: AppAccessDecision | undefined) {
  if (
    !access ||
    access.appId !== ACCOUNT_APP_ID ||
    !Number.isFinite(access.recheckAt) ||
    access.recheckAt <= Date.now()
  ) {
    return {
      status: 503 as const,
      code: 'access_check_unavailable',
      message: 'Account access could not be checked. Please try again.',
    };
  }
  if (access.allowed !== true)
    return {
      status: access.reason === 'sign_in_required' ? (401 as const) : (403 as const),
      code: 'application_access_denied',
      reason: access.reason,
      message: 'This account does not currently have access to Brighter Worlds account storage.',
    };
  return null;
}
export function applyCookie(event: RequestEvent, cookie?: CookieInstructions) {
  if (!cookie) return;
  const options = { ...cookie.options };
  delete options.domain;
  const localOptions = {
    ...options,
    httpOnly: true,
    secure: event.url.protocol === 'https:' || !event.url.hostname.endsWith('.localhost'),
  };
  if (cookie.method === 'set') event.cookies.set(cookie.name, cookie.value, localOptions);
  else event.cookies.delete(cookie.name, localOptions);
  // An early hook response bypasses resolve(), which normally attaches SvelteKit's cookies.
  event.locals.ankhCookies ??= new Map();
  event.locals.ankhCookies.set(
    `${cookie.name}:${localOptions.path}`,
    event.cookies.serialize(cookie.name, cookie.method === 'delete' ? '' : cookie.value, {
      ...localOptions,
      ...(cookie.method === 'delete' ? { maxAge: 0 } : {}),
    }),
  );
}
export function normalizeLocalReturnTo(event: RequestEvent, value: string | null) {
  try {
    const url = new URL(value || '/character', event.url);
    if (url.origin !== event.url.origin || /^\/(auth|api)(\/|$)/.test(url.pathname))
      return '/character';
    url.searchParams.delete('ankh_login');
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return '/character';
  }
}
function unavailable(): never {
  error(503, {
    code: 'authentication_unavailable',
    message:
      'Account sign-in is temporarily unavailable. Local sheets and backups are still available.',
  });
}
/** Public local pages do not create an identity. Anonymous identity is created only for an explicit sign-in/signup. */
export async function getAnkhResponse(event: RequestEvent) {
  event.locals.user = undefined;
  event.locals.access = undefined;
  event.locals.permissions = new Set();
  const service = event.platform?.env.AUTH;
  event.locals.authState = service ? 'signed-out' : 'unconfigured';
  if (!service || !event.request.headers.get('Cookie')) return;
  try {
    const name = await service.getSessionCookieName();
    if (!name) throw new Error('Missing cookie contract');
    const token = event.cookies.get(name);
    if (!token) return;
    const result = await service.verifySession(token);
    applyCookie(event, result.cookie);
    if (!result.valid) return;
    if (!result.user?.id || typeof result.user.isAnonymous !== 'boolean')
      throw new Error('Invalid identity');
    event.locals.user = result.user;
    event.locals.access = result.access;
    event.locals.authState = 'authenticated';
    if (!applicationAccessFailure(result.access)) event.locals.permissions = result.permissions;
    // No anonymous-owned cloud records exist here; upgradedFromUserId needs no migration.
  } catch {
    event.locals.user = undefined;
    event.locals.access = undefined;
    event.locals.authState = 'unavailable';
  }
}
export function requireAccount(event: RequestEvent) {
  if (
    event.locals.authState === 'unconfigured' ||
    event.locals.authState === 'unavailable' ||
    !event.locals.authState
  )
    unavailable();
  if (!event.locals.user)
    error(401, { code: 'sign_in_required', message: 'Sign in to use account storage.' });
  const failure = applicationAccessFailure(event.locals.access);
  if (failure) error(failure.status, failure);
  if (event.locals.user.isAnonymous)
    error(401, { code: 'sign_in_required', message: 'Sign in to use account storage.' });
  return event.locals.user;
}
function requireAuthService(event: RequestEvent) {
  if (!CONSUMER_ORIGINS.has(event.url.origin))
    error(400, {
      code: 'unregistered_origin',
      message: 'Open Brighter Worlds at its root or dev address to sign in.',
    });
  const service = event.platform?.env.AUTH;
  if (!service) unavailable();
  return service;
}
export async function createAnkhRedirect(
  event: RequestEvent,
  kind: 'login' | 'signup',
): Promise<never> {
  const service = requireAuthService(event);
  const returnTo = new URL(
    normalizeLocalReturnTo(event, event.url.searchParams.get('returnTo') ?? '/account'),
    event.url.origin,
  ).href;
  let ticket: string;
  try {
    const name = await service.getSessionCookieName();
    if (!name) unavailable();
    let token = event.cookies.get(name);
    if (!token) {
      const created = await service.createAnonymousSession();
      applyCookie(event, created.cookie);
      token = created.cookie.value;
    }
    const issue = () =>
      kind === 'login'
        ? service.createLoginTicket(token!, returnTo)
        : service.createSignupTicket(token!, returnTo);
    ticket = await issue();
    if (!ticket) {
      // The documented single retry is for an explicitly invalid token, never an RPC outage or access denial.
      applyCookie(event, { method: 'delete', name, value: '', options: { path: '/' } });
      const created = await service.createAnonymousSession();
      applyCookie(event, created.cookie);
      token = created.cookie.value;
      ticket = await issue();
    }
  } catch {
    unavailable();
  }
  if (!ticket)
    error(401, { code: 'sign_in_failed', message: 'Could not start sign-in. Please try again.' });
  redirect(303, `${publicAnkh(event)}/${kind}?ticket=${encodeURIComponent(ticket)}`);
}
export async function redeemAnkhCompletion(event: RequestEvent) {
  const completion = event.url.searchParams.get('ankh_login');
  if (!completion) return;
  const service = requireAuthService(event);
  const clean = new URL(event.url);
  clean.searchParams.delete('ankh_login');
  const returnTo = normalizeLocalReturnTo(event, `${clean.pathname}${clean.search}${clean.hash}`);
  try {
    const name = await service.getSessionCookieName();
    if (!name) unavailable();
    const token = event.cookies.get(name);
    if (!token) redirect(303, `/auth/login?returnTo=${encodeURIComponent(returnTo)}`);
    const redeemed = await service.redeemLoginCompletion(token, completion);
    if (!redeemed) {
      applyCookie(event, { method: 'delete', name, value: '', options: { path: '/' } });
      redirect(303, `/auth/login?returnTo=${encodeURIComponent(returnTo)}`);
    }
    applyCookie(event, redeemed.cookie);
    redirect(303, returnTo);
  } catch (caught) {
    if (isRedirect(caught)) throw caught;
    // Keep the old cookie/code for Ankh's idempotent redemption retry after a lost RPC response.
    unavailable();
  }
}
export function requireSameOrigin(event: RequestEvent) {
  const origin = event.request.headers.get('Origin');
  if (
    (origin && origin !== event.url.origin) ||
    event.request.headers.get('Sec-Fetch-Site') === 'cross-site'
  ) {
    error(403, {
      code: 'cross_origin_request',
      message: 'Open this action on the Brighter Worlds site.',
    });
  }
}
export async function createAnkhLogoutRedirect(event: RequestEvent): Promise<never> {
  requireSameOrigin(event);
  const service = requireAuthService(event);
  let ticket: string | undefined;
  try {
    const name = await service.getSessionCookieName();
    if (!name) unavailable();
    const token = event.cookies.get(name);
    ticket = token
      ? await service.createLogoutTicket(token, new URL('/account', event.url.origin).href)
      : undefined;
    // Create the logout ticket before deleting the host-local cookie.
    applyCookie(event, { method: 'delete', name, value: '', options: { path: '/' } });
  } catch {
    unavailable();
  }
  redirect(
    303,
    ticket ? `${publicAnkh(event)}/logout?ticket=${encodeURIComponent(ticket)}` : '/account',
  );
}
export function accountSummary(event: RequestEvent) {
  const user = event.locals.user;
  const failure = user ? applicationAccessFailure(event.locals.access) : null;
  return {
    state: event.locals.authState ?? 'unconfigured',
    user:
      user && !user.isAnonymous
        ? {
            id: user.id,
            displayName: user.displayName ?? user.firstName ?? 'User',
            email: user.email,
            avatar: user.avatar,
          }
        : null,
    allowed: !!user && !user.isAnonymous && !failure,
    reason: failure?.code === 'application_access_denied' ? failure.reason : undefined,
    accessUnavailable: failure?.status === 503,
    storageConfigured: !!event.platform?.env.STORE,
    accountUrl: `${publicAnkh(event)}/account?app=bwo&returnTo=${encodeURIComponent(new URL('/account', event.url.origin).href)}`,
  };
}
