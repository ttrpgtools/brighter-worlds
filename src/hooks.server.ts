import { getAnkhResponse, redeemAnkhCompletion, requireAccount } from '$lib/server/ankh';
import { isHttpError, isRedirect, json, type Handle } from '@sveltejs/kit';
import { building } from '$app/environment';

export const handle: Handle = async ({ event, resolve }) => {
  // Public reference pages are prerendered without cookies, query strings or service RPCs.
  if (building) return resolve(event);
  event.locals.ankhCookies = new Map();
  event.locals.permissions = new Set();
  const path = event.url.pathname;
  const authRoute = /^\/auth\/(login|signup|logout)\/?$/.test(path);
  const transferRoute = /^\/migrate\/?$/.test(path);
  const api = path.startsWith('/api/');
  function early(response: Response) {
    for (const cookie of event.locals.ankhCookies?.values() ?? [])
      response.headers.append('Set-Cookie', cookie);
    return response;
  }
  try {
    if (event.request.method === 'GET' && !api && !authRoute) await redeemAnkhCompletion(event);
    // Local recovery must not wait for account verification, even with an existing cookie.
    if (!authRoute && !transferRoute) {
      await getAnkhResponse(event);
      if (api && path !== '/api/session') requireAccount(event);
    }
    const response = await resolve(event);
    response.headers.set('Cache-Control', 'no-store');
    response.headers.set('Referrer-Policy', 'no-referrer');
    return response;
  } catch (caught) {
    const headers = { 'Cache-Control': 'no-store', 'Referrer-Policy': 'no-referrer' };
    if (isRedirect(caught)) {
      return early(
        event.isDataRequest
          ? json({ type: 'redirect', location: caught.location }, { headers })
          : new Response(null, {
              status: caught.status,
              headers: { ...headers, Location: caught.location },
            }),
      );
    }
    if (isHttpError(caught)) {
      return early(
        json(
          { error: caught.body.code ?? 'account_request_failed', ...caught.body },
          {
            status: caught.status,
            headers: { ...headers, ...(caught.status === 503 ? { 'Retry-After': '5' } : {}) },
          },
        ),
      );
    }
    throw caught;
  }
};
