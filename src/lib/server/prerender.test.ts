import { expect, it, vi } from 'vitest';
vi.mock('$app/environment', () => ({ building: true }));
import { handle } from '../../hooks.server';
import { event, authService } from './test-fixtures';

it('prerenders public reference pages without touching URL queries, cookies or auth', async () => {
  const auth = authService();
  const ev = event('/arcana', { auth });
  Object.defineProperty(ev.url, 'searchParams', {
    get() {
      throw new Error('Unavailable during prerender');
    },
  });
  ev.cookies.get = () => {
    throw new Error('No cookies during prerender');
  };
  const resolve = vi.fn(async () => new Response('reference content'));
  const response = await handle({ event: ev, resolve } as Parameters<typeof handle>[0]);
  expect(await response.text()).toBe('reference content');
  expect(auth.getSessionCookieName).not.toHaveBeenCalled();
});
