import 'fake-indexeddb/auto';
import { clear } from 'idb-keyval';
import { beforeEach, expect, it, vi } from 'vitest';
import { createAccountSession } from '$lib/data/account-session';
import { canUseSheet } from './access';

beforeEach(async () => {
  await clear();
});

async function setup() {
  let owner: string | null = 'A';
  let offline = false;
  const session = createAccountSession(
    vi.fn(async () => {
      if (offline) throw new Error('offline');
      return Response.json({
        state: owner ? 'authenticated' : 'signed-out',
        user: owner ? { id: owner, displayName: owner } : null,
        allowed: !!owner,
      });
    }) as typeof fetch,
  );
  await session.refresh();
  return {
    session,
    async change(next: string | null) {
      owner = next;
      offline = false;
      await session.refresh();
    },
    async disconnect() {
      offline = true;
      await session.refresh();
    },
  };
}

it.each(['B', null])('blocks old sheet actions after switching to %s', async (next) => {
  const auth = await setup();
  const started = auth.session.current().epoch;
  expect(canUseSheet(auth.session, 'A')).toBe(true);
  await auth.change(next);
  expect(canUseSheet(auth.session, 'A')).toBe(false);
  expect(canUseSheet(auth.session, 'A', started)).toBe(false);
  await auth.change('A');
  expect(canUseSheet(auth.session, 'A')).toBe(true);
  // A pending damage/cast dialog must not resume after signing back in.
  expect(canUseSheet(auth.session, 'A', started)).toBe(false);
});

it('allows fresh offline-owner actions and local sheets, but cancels older dialog actions', async () => {
  const auth = await setup();
  const started = auth.session.current().epoch;
  await auth.disconnect();
  expect(canUseSheet(auth.session, 'A')).toBe(true);
  expect(canUseSheet(auth.session, 'A', started)).toBe(false);
  expect(canUseSheet(auth.session, 'B')).toBe(false);
  await auth.change(null);
  await auth.disconnect();
  expect(canUseSheet(auth.session, 'A')).toBe(false);
  expect(canUseSheet(auth.session)).toBe(true);
  expect(canUseSheet(auth.session, null, started)).toBe(true);
});
