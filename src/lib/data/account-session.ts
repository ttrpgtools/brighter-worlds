import { getContext, setContext } from 'svelte';
import { get, writable } from 'svelte/store';
import type { accountSummary } from '$lib/server/ankh';
import { get as read, set } from 'idb-keyval';
export type Account = ReturnType<typeof accountSummary>;
const KEY = Symbol('account-session');
const LAST_OWNER = 'bw-account:last-owner';
export function createAccountSession(fetcher: typeof fetch = fetch) {
  const state = writable<{ account: Account | null; offlineOwner?: string; epoch: number }>({
    account: null,
    epoch: 0,
  });
  let sequence = 0;
  let loadedOwner: string | undefined;
  let lastIdentity: string | null | undefined;
  let epoch = 0;
  async function performRefresh() {
    const seq = ++sequence;
    let account: Account | null = null;
    try {
      const response = await fetcher('/api/session', { cache: 'no-store' });
      if (!response.ok) throw new Error('Account unavailable');
      const data = await response.json();
      if (
        !data ||
        !['authenticated', 'signed-out', 'unavailable', 'unconfigured'].includes(data.state) ||
        typeof data.allowed !== 'boolean' ||
        (data.user !== null &&
          (!data.user ||
            typeof data.user.id !== 'string' ||
            typeof data.user.displayName !== 'string')) ||
        (data.allowed && (data.state !== 'authenticated' || !data.user))
      )
        throw new Error('Invalid account response');
      account = data;
    } catch {
      /* Cached drafts remain available to the last verified owner during an outage. */
    }
    if (seq !== sequence) return;
    if (loadedOwner === undefined)
      loadedOwner = await read<string>(LAST_OWNER).catch(() => undefined);
    if (seq !== sequence) return;
    const unavailable = !account || ['unavailable', 'unconfigured'].includes(account.state);
    const identity = unavailable ? undefined : (account?.user?.id ?? null);
    if (identity !== lastIdentity) {
      epoch++;
      lastIdentity = identity;
    }
    if (!unavailable) {
      loadedOwner = identity ?? '';
      await set(LAST_OWNER, loadedOwner).catch(() => {});
    }
    if (seq === sequence)
      state.set({ account, offlineOwner: unavailable ? loadedOwner : undefined, epoch });
  }
  let inFlight: Promise<void> | undefined;
  return {
    subscribe: state.subscribe,
    current: () => get(state),
    refresh: () =>
      (inFlight ??= performRefresh().finally(() => {
        inFlight = undefined;
      })),
  };
}
export type AccountSession = ReturnType<typeof createAccountSession>;
export function provideAccountSession() {
  const value = createAccountSession();
  setContext(KEY, value);
  return value;
}
export function getAccountSession() {
  return getContext<AccountSession>(KEY);
}
export function canReadAccount(session: AccountSession, owner: string) {
  const current = session.current();
  return current.account?.user?.id === owner || current.offlineOwner === owner;
}
export function canSaveAccount(session: AccountSession, owner: string) {
  const current = session.current();
  return current.account?.user?.id === owner && current.account.allowed;
}
