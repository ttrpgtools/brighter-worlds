import 'fake-indexeddb/auto';
import { beforeEach, expect, it, vi } from 'vitest';
import { clear } from 'idb-keyval';
import { createAccountSession, canReadAccount, canSaveAccount } from './account-session';
beforeEach(async () => {
  await clear();
});
const account = (id: string | null) => ({
  state: id ? 'authenticated' : 'signed-out',
  user: id ? { id, displayName: id } : null,
  allowed: !!id,
  storageConfigured: true,
});
it('shares one in-flight verification and isolates the last verified offline owner across account changes', async () => {
  let user: string | null = 'A';
  let offline = false;
  const fetcher = vi.fn(async () => {
    if (offline) throw new Error('offline');
    return Response.json(account(user));
  }) as typeof fetch;
  const first = createAccountSession(fetcher);
  await Promise.all([first.refresh(), first.refresh()]);
  expect(fetcher).toHaveBeenCalledTimes(1);
  expect(canSaveAccount(first, 'A')).toBe(true);
  offline = true;
  const reloaded = createAccountSession(fetcher);
  await reloaded.refresh();
  expect(canReadAccount(reloaded, 'A')).toBe(true);
  expect(canSaveAccount(reloaded, 'A')).toBe(false);
  offline = false;
  user = 'B';
  await reloaded.refresh();
  expect(canReadAccount(reloaded, 'A')).toBe(false);
  expect(canSaveAccount(reloaded, 'B')).toBe(true);
  offline = true;
  const last = createAccountSession(fetcher);
  await last.refresh();
  expect(canReadAccount(last, 'A')).toBe(false);
  expect(canReadAccount(last, 'B')).toBe(true);
});
it('clears offline identity on verified sign-out without deleting the separate account drafts', async () => {
  let user: string | null = 'A';
  let offline = false;
  const fetcher = vi.fn(async () => {
    if (offline) throw new Error('offline');
    return Response.json(account(user));
  }) as typeof fetch;
  const session = createAccountSession(fetcher);
  await session.refresh();
  user = null;
  await session.refresh();
  offline = true;
  await session.refresh();
  expect(canReadAccount(session, 'A')).toBe(false);
});

it('treats malformed session responses as an outage rather than verified sign-out', async () => {
  const fetcher = vi.fn(async () => Response.json(account('A'))) as typeof fetch;
  const session = createAccountSession(fetcher);
  await session.refresh();
  vi.mocked(fetcher).mockResolvedValueOnce(Response.json({}));
  await session.refresh();
  expect(canReadAccount(session, 'A')).toBe(true);
  expect(canSaveAccount(session, 'A')).toBe(false);
});
