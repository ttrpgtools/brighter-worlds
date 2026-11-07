import { expect, it, vi } from 'vitest';
import { handle } from '../../hooks.server';
import { event, authService } from './test-fixtures';

it.each(
  ['https://brighterworlds.app', 'https://dev.brighterworlds.app'].flatMap((origin) =>
    ['/', '/migrate', '/migrate/', '/character', '/character/hero_01'].map((path) => ({
      origin,
      path,
    })),
  ),
)(
  'keeps $origin$path accessible without an account, services or a dev redirect',
  async ({ origin, path }) => {
    const resolve = vi.fn(async () => new Response('local recovery page'));
    const response = await handle({ event: event(path, { origin }), resolve } as Parameters<
      typeof handle
    >[0]);
    expect(response.status).toBe(200);
    expect(response.headers.get('Location')).toBeNull();
    expect(await response.text()).toBe('local recovery page');
    expect(resolve).toHaveBeenCalledOnce();
  },
);

it.each(['https://brighterworlds.app', 'https://dev.brighterworlds.app'])(
  'keeps %s/migrate accessible during an auth outage with an existing cookie',
  async (origin) => {
    const auth = authService();
    auth.verifySession.mockRejectedValue(new Error('Auth unavailable'));
    const ev = event('/migrate', {
      auth,
      token: 'existing-cookie',
      origin,
    });
    const resolve = vi.fn(async () => new Response('transfer page'));
    const response = await handle({ event: ev, resolve } as Parameters<typeof handle>[0]);
    expect(auth.getSessionCookieName).not.toHaveBeenCalled();
    expect(auth.verifySession).not.toHaveBeenCalled();
    expect(response.status).toBe(200);
    expect(resolve).toHaveBeenCalledOnce();
  },
);
