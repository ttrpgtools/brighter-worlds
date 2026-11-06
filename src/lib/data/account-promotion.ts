import { entries, type UseStore } from 'idb-keyval';
import { transaction, request, sheetDatabase } from './storage-transaction';
import { accountKey, portableCharacter, type AccountRecord } from './account-persistence';
import { canReadAccount, type AccountSession } from './account-session';
import { buildBundle, canonical, contentHash } from './sheet-format/codec';
import type { SheetBundleV1 } from './sheet-format/types';
import { localFingerprint } from './legacy-sheet';
import { tombstoneKey } from './sheet-recovery';
export const promotionKey = (id: string) => `bw-promoted:v1:${encodeURIComponent(id)}`;
export interface Promotion {
  owner: string;
  id: string;
}
export async function readPromotion(id: string, database: UseStore = sheetDatabase) {
  return transaction(
    'readonly',
    (store) => request<Promotion | undefined>(store.get(promotionKey(id))),
    database,
  );
}
/** Retire an unchanged local source only after its complete account group is durable and acknowledged. */
export async function promoteLocalGroup(
  bundle: SheetBundleV1,
  owner: string,
  map: [string, string][],
  session: AccountSession,
  database: UseStore = sheetDatabase,
) {
  if (!canReadAccount(session, owner)) return false;
  const snapshots = await transaction(
    'readonly',
    async (store) =>
      Promise.all(
        map.map(async ([original, id]) => ({
          original,
          id,
          local: await request(store.get(`bw-sheet-${original}`)),
          account: await request<AccountRecord | undefined>(store.get(accountKey(owner, id))),
        })),
      ),
    database,
  );
  if (snapshots.every((row) => !row.local)) {
    const markers = await Promise.all(map.map(([original]) => readPromotion(original, database)));
    return markers.every((marker, index) => marker?.owner === owner && marker.id === map[index][1]);
  }
  for (const row of snapshots) {
    if (
      !row.local ||
      !row.account?.remoteVersion ||
      row.account.deleted ||
      row.account.owner !== owner
    )
      return false;
    const selected = bundle.sheets.find((sheet) => sheet.id === row.original);
    if (!selected || canonical(await portableCharacter(row.local)) !== canonical(selected))
      return false;
  }
  return transaction(
    'readwrite',
    async (store) => {
      if (!canReadAccount(session, owner)) return false;
      for (const row of snapshots) {
        if (
          localFingerprint(await request(store.get(`bw-sheet-${row.original}`))) !==
          localFingerprint(row.local)
        )
          return false;
        const account = await request<AccountRecord | undefined>(
          store.get(accountKey(owner, row.id)),
        );
        if (account?.token !== row.account?.token) return false;
      }
      for (const row of snapshots) {
        store.put(
          {
            owner,
            id: row.id,
            localId: row.original,
            character: row.local,
            promotedAt: Date.now(),
          },
          `bw-recovery:account:${crypto.randomUUID()}`,
        );
        store.put({ owner, id: row.id } satisfies Promotion, promotionKey(row.original));
        store.put(
          { version: 1, deletedAt: Date.now(), promotedTo: { owner, id: row.id } },
          tombstoneKey(row.original),
        );
        store.delete(`bw-sheet-${row.original}`);
      }
      return true;
    },
    database,
  );
}
/** Upgrade old copy-style saves only when the receipt proves the entire local group is unchanged. */
export async function reconcileLocalPromotions(
  owner: string,
  session: AccountSession,
  database: UseStore = sheetDatabase,
) {
  if (!canReadAccount(session, owner)) return false;
  const values = new Map(await entries<string, any>(database));
  const prefix = `bw-transfer:v1:account:${encodeURIComponent(owner)}:`;
  let changed = false;
  for (const [key, receipt] of values) {
    if (
      !key.startsWith(prefix) ||
      receipt?.owner !== owner ||
      !Array.isArray(receipt.map) ||
      !receipt.map.length
    )
      continue;
    try {
      const local = new Map<string, unknown>(
        receipt.map.map(([original]: [string, string]) => [
          original,
          values.get(`bw-sheet-${original}`),
        ]),
      );
      if ([...local.values()].some((value) => !value)) continue;
      const { bundle } = await buildBundle(
        local,
        [receipt.map[0][0]],
        typeof window === 'undefined' ? null : window.location.origin,
      );
      if (
        (await contentHash({ sheets: bundle.sheets, roots: bundle.roots, nonce: null })) !==
        key.slice(prefix.length)
      )
        continue;
      changed = (await promoteLocalGroup(bundle, owner, receipt.map, session, database)) || changed;
    } catch {
      /* Divergent or damaged originals remain independent and recoverable. */
    }
  }
  return changed;
}
