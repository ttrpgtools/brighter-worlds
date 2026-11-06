import { expect, it, vi } from 'vitest';
import { handle } from '../../hooks.server';
import { event, authService } from './test-fixtures';

it.each(['/migrate', '/character', '/character/hero_01'])(
  'keeps %s accessible without an account or configured services',
  async (path) => {
    const resolve = vi.fn(async () => new Response('local recovery page'));
    const response = await handle({ event: event(path), resolve } as Parameters<typeof handle>[0]);
    expect(response.status).toBe(200);
    expect(await response.text()).toBe('local recovery page');
    expect(resolve).toHaveBeenCalledOnce();
  },
);

it('keeps the old-site transfer route accessible during an auth outage with an existing cookie', async () => {
  const auth = authService();
  auth.verifySession.mockRejectedValue(new Error('Auth unavailable'));
  const ev = event('/migrate', {
    auth,
    token: 'existing-cookie',
    origin: 'https://dev.brighterworlds.app',
  });
  const resolve = vi.fn(async () => new Response('transfer page'));
  const response = await handle({ event: ev, resolve } as Parameters<typeof handle>[0]);
  expect(auth.getSessionCookieName).not.toHaveBeenCalled();
  expect(auth.verifySession).not.toHaveBeenCalled();
  expect(response.status).toBe(200);
  expect(resolve).toHaveBeenCalledOnce();
});
