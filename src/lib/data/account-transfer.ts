import { promoteLocalGroup } from './account-promotion';
import type { Character } from '$lib/types';
import type { SheetCache } from './sheet-manager';
import type { SheetBundleV1, SheetDocumentV1 } from './sheet-format/types';
import { buildBundle, canonical, contentHash, hydrateSheet } from './sheet-format/codec';
import { collectBackupData } from './sheet-backup';
import { request, transaction, sheetDatabase } from './storage-transaction';
import { type UseStore } from 'idb-keyval';
import { accountClient, AccountError, accountHref } from './account-client';
import {
  accountBundle,
  accountKey,
  createAccountSheet,
  portableCharacter,
  type AccountRecord,
} from './account-persistence';
import { canSaveAccount, type AccountSession } from './account-session';
export interface OnlineSelection {
  bundle: SheetBundleV1;
  warnings: string[];
  settings: Map<string, Character['settings']>;
}
export async function prepareOnlineSelection(
  id: string,
  cache?: SheetCache,
): Promise<OnlineSelection> {
  const source = await collectBackupData(cache);
  const result = await buildBundle(source.sheets, [id], window.location.origin);
  return {
    ...result,
    settings: new Map([...source.sheets].map(([id, char]) => [id, (char as Character).settings])),
  };
}
export async function prepareAccountSelection(
  owner: string,
  id: string,
  current?: Character,
): Promise<OnlineSelection> {
  const result = await accountBundle(owner, id, undefined, current);
  return { ...result, settings: new Map() };
}
function rewrite(bundle: SheetBundleV1, map: Map<string, string>) {
  const result = structuredClone(bundle);
  result.id = crypto.randomUUID();
  result.exportedAt = Date.now();
  result.roots = result.roots.map((id) => map.get(id) ?? id);
  for (const sheet of result.sheets) {
    sheet.id = map.get(sheet.id) ?? sheet.id;
    for (const rel of sheet.relations) rel.sheetId = map.get(rel.sheetId) ?? rel.sheetId;
  }
  result.unresolvedRelations = result.unresolvedRelations.map((rel) => ({
    ...rel,
    sheetId: map.get(rel.sheetId) ?? rel.sheetId,
    targetSheetId: map.get(rel.targetSheetId) ?? rel.targetSheetId,
  }));
  return result;
}
export async function saveOnlineSelection(
  selection: OnlineSelection,
  session: AccountSession,
  options: { database?: UseStore; nonce?: string; expectedOwner?: string } = {},
) {
  await session.refresh();
  const owner = session.current().account?.user?.id;
  if (!owner || !canSaveAccount(session, owner))
    throw new AccountError('sign_in_required', 'Sign in to save sheets online.');
  if (options.expectedOwner && owner !== options.expectedOwner)
    throw new AccountError(
      'account_changed',
      'The account changed. Review the selected sheets with their owner before saving.',
    );
  if (selection.bundle.assets.length)
    throw new AccountError(
      'images',
      'This group contains embedded images. Keep a file backup; online saving currently supports image URLs. No images have been removed.',
    );
  if (selection.bundle.unresolvedRelations.length)
    throw new AccountError(
      'companions',
      'Some companion sheets are missing. Recover them or remove their broken links before saving this group online.',
    );
  const database = options.database ?? sheetDatabase;
  const client = accountClient(owner);
  const digest = await contentHash({
    sheets: selection.bundle.sheets,
    roots: selection.bundle.roots,
    nonce: options.nonce ?? null,
  });
  const key = `bw-transfer:v1:account:${encodeURIComponent(owner)}:${digest}`;
  type Receipt = { owner: string; map: [string, string][]; copied: boolean };
  let receipt = (await transaction('readonly', (store) => request(store.get(key)), database)) as
    | Receipt
    | undefined;
  if (!receipt) {
    let copied = !!options.nonce;
    const existing = new Map<string, AccountRecord | undefined>();
    for (const sheet of selection.bundle.sheets) {
      const cached = (await transaction(
        'readonly',
        (store) => request(store.get(accountKey(owner, sheet.id))),
        database,
      )) as AccountRecord | undefined;
      existing.set(sheet.id, cached);
      if (cached && canonical(await portableCharacter(cached.character)) !== canonical(sheet))
        copied = true;
      try {
        const remote = await client.get(sheet.id);
        if (canonical(remote.data) !== canonical(sheet)) copied = true;
      } catch (error) {
        if (!(error instanceof AccountError && error.code === 'not_found')) throw error;
      }
    }
    receipt = {
      owner,
      map: selection.bundle.sheets.map((sheet) => [
        sheet.id,
        copied ? crypto.randomUUID() : sheet.id,
      ]),
      copied,
    };
    const mapped = rewrite(selection.bundle, new Map(receipt.map));
    const originals = new Map(receipt.map.map(([from, to]) => [to, from]));
    const newRows = mapped.sheets.map((sheet) => {
      const char = hydrateSheet(
        sheet,
        new Map(),
        new Map(),
        new Set(mapped.sheets.map((x) => x.id)),
      );
      char.settings = selection.settings.get(originals.get(sheet.id)!);
      return {
        format: 'bw-account-cache',
        version: 1,
        owner,
        id: sheet.id,
        token: crypto.randomUUID(),
        character: char,
        revision: 0,
        savedRevision: -1,
      } satisfies AccountRecord;
    });
    await transaction(
      'readwrite',
      async (store) => {
        if (await request(store.get(key)))
          throw new Error('This transfer was prepared in another tab. Retry to read its receipt.');
        for (const row of newRows) {
          const current = (await request(store.get(accountKey(owner, row.id)))) as
            | AccountRecord
            | undefined;
          const original = existing.get(originals.get(row.id)!);
          if (current && (copied || current.token !== original?.token))
            throw new Error('A cached sheet changed. Review the group again before saving.');
          if (!current) store.put(row, accountKey(owner, row.id));
        }
        store.put(receipt, key);
      },
      database,
    );
  }
  const outcomes = [];
  for (const [original, id] of receipt.map) {
    if (!canSaveAccount(session, owner)) break;
    const row = (await transaction(
      'readonly',
      (store) => request(store.get(accountKey(owner, id))),
      database,
    )) as AccountRecord | undefined;
    if (!row) {
      outcomes.push({
        id,
        original,
        name: selection.bundle.sheets.find((x) => x.id === original)?.character.name ?? id,
        phase: 'cache-missing',
        message:
          'This transfer’s cached draft was removed. Check the account library or start a new linked copy; the original local sheets are kept.',
      });
      continue;
    }
    const controller = createAccountSheet(owner, id, session, { database, autoSave: false });
    try {
      await controller.loaded;
      await controller.flush();
      let status: import('./account-persistence').AccountStatus | undefined;
      const stop = controller.status.subscribe((value) => {
        status = value;
      });
      stop();
      outcomes.push({
        id,
        original,
        name: row.character.name,
        phase: status!.phase,
        message: status!.message,
      });
    } finally {
      controller.dispose();
    }
  }
  const complete =
    outcomes.length === receipt.map.length &&
    outcomes.every((item) => item.phase === 'saved') &&
    canSaveAccount(session, owner);
  const promoted =
    complete && !options.nonce
      ? await promoteLocalGroup(selection.bundle, owner, receipt.map, session, database)
      : false;
  return {
    owner,
    outcomes,
    promoted,
    copied: receipt.copied,
    complete,
    href: accountHref(owner, new Map(receipt.map).get(selection.bundle.roots[0])!),
  };
}
export async function keepAccountLocally(owner: string, id: string, current?: Character) {
  const { bundle } = await accountBundle(owner, id, undefined, current);
  const map = new Map(bundle.sheets.map((sheet) => [sheet.id, crypto.randomUUID()]));
  const copy = rewrite(bundle, map);
  const { prepareBackup, restoreBackup } = await import('./sheet-backup');
  const result = await restoreBackup(await prepareBackup(JSON.stringify(copy)), 'copy');
  return result.find((row) => row.id === map.get(id))?.destinationId ?? map.get(id)!;
}
