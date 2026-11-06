import { EMPTY, type Character } from '$lib/types';
import { getEmptySheet } from './sheet-manager';
import {
  accountKey,
  createAccountSheet,
  cachedAccount,
  type AccountRecord,
} from './account-persistence';
import { canReadAccount, type AccountSession } from './account-session';
import { accountHref } from './account-client';
import { buildBundle } from './sheet-format/codec';
import { transaction, request, sheetDatabase } from './storage-transaction';
import type { UseStore } from 'idb-keyval';
export function newCharacter(
  partial: Partial<Character>,
  id: string = crypto.randomUUID(),
): Character {
  const now = Date.now();
  return { ...getEmptySheet(), ...partial, id, [EMPTY]: false, created: now, sortkey: now };
}
/** A new account character begins as a durable account draft, never a separate local character. */
export async function createAccountCharacters(
  owner: string,
  root: Character,
  companions: Character[],
  session: AccountSession,
  database: UseStore = sheetDatabase,
) {
  const characters = new Map([root, ...companions].map((character) => [character.id, character]));
  const { bundle } = await buildBundle(
    characters,
    [root.id],
    typeof window === 'undefined' ? null : window.location.origin,
  );
  if (bundle.unresolvedRelations.length)
    throw new Error('A companion is missing. Your creation draft is still open.');
  if (!canReadAccount(session, owner))
    throw new Error(
      'The account changed. Sign back in to the account you started with before creating this character.',
    );
  const rows = bundle.sheets.map(
    (document): AccountRecord => ({
      format: 'bw-account-cache',
      version: 1,
      owner,
      id: document.id,
      token: crypto.randomUUID(),
      character: characters.get(document.id)!,
      revision: 0,
      savedRevision: -1,
    }),
  );
  await transaction(
    'readwrite',
    async (store) => {
      for (const row of rows) {
        if (await request(store.get(accountKey(owner, row.id))))
          throw new Error('This draft already exists. Open it from your character library.');
        store.put(row, accountKey(owner, row.id));
      }
    },
    database,
  );
  return accountHref(owner, root.id);
}
/** Resume newly created companions as well as the root; report partial progress truthfully. */
export async function saveCachedCompanions(
  owner: string,
  root: string,
  session: AccountSession,
  database: UseStore = sheetDatabase,
) {
  if (!canReadAccount(session, owner)) return [];
  const rows = await cachedAccount(owner, database);
  const { bundle } = await buildBundle(
    new Map(rows.map((row) => [row.id, row.character])),
    [root],
    typeof window === 'undefined' ? null : window.location.origin,
  );
  const unsaved: string[] = bundle.unresolvedRelations.map(
    (relation) => `Missing companion ${relation.targetSheetId}`,
  );
  for (const document of [...bundle.sheets].reverse()) {
    if (document.id === root || !canReadAccount(session, owner)) continue;
    const controller = createAccountSheet(owner, document.id, session, {
      database,
      autoSave: false,
    });
    try {
      await controller.loaded;
      await controller.flush();
      let saved = false;
      controller.status.subscribe((status) => {
        saved = status.phase === 'saved';
      })();
      if (!saved) unsaved.push(document.character.name || 'Companion');
    } finally {
      controller.dispose();
    }
  }
  return canReadAccount(session, owner) ? unsaved : [];
}
