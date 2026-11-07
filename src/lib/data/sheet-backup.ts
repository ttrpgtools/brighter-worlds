import { entries, type UseStore } from 'idb-keyval';
import { get } from 'svelte/store';
import { download } from '$lib/util/download';
import { snapshotState } from '$lib/util/snapshot.svelte';
import { localFingerprint, normalizeLegacySheet, record, validSheetId } from './legacy-sheet';
import { SHEET_PREFIX, LIST_KEY, tombstoneKey } from './sheet-recovery';
import { request, sheetDatabase, transaction } from './storage-transaction';
import {
  assertSheet,
  bounded,
  buildBundle,
  canonical,
  contentHash,
  encodeSheet,
  ExportContext,
  hydrateSheet,
  hash,
  MAX_BACKUP_BYTES,
  utf8Size,
  validateBundle,
} from './sheet-format/codec';
import {
  encodeGameData,
  GAME_KEYS,
  hydrateGameEntry,
  validateBrowserBackup,
  type BrowserBackupV1,
  type GameEntry,
} from './sheet-format/game-data';
import type { SheetBundleV1 } from './sheet-format/types';
import type { SheetCache } from './sheet-manager';

export interface ImportOutcome {
  id: string;
  destinationId?: string;
  name: string;
  outcome: 'restored' | 'already-present' | 'kept-current' | 'already-processed';
}
export interface PreparedBackup {
  bundle: SheetBundleV1 | null;
  game: GameEntry[];
  gameAssets: Map<string, Blob>;
  sheetAssets: Map<string, Blob>;
  statuses: { id: string; name: string; state: 'new' | 'same' | 'conflict' }[];
  existingGame: string[];
  warnings: string[];
  digest: string;
  originalText: string;
  snapshots: Map<string, unknown>;
}
export type CollisionPolicy = 'copy' | 'skip';

/** Read-only: never initialize stores or run migration as a side effect of export. */
export async function collectBackupData(cache?: SheetCache, database: UseStore = sheetDatabase) {
  const values = new Map<string, unknown>();
  const warnings: string[] = [];
  try {
    for (const [key, value] of await entries<IDBValidKey, unknown>(database))
      if (typeof key === 'string') values.set(key, value);
  } catch {
    warnings.push(
      'IndexedDB was unavailable. This download includes readable original records and open sheets only.',
    );
  }
  if (typeof window !== 'undefined') {
    try {
      for (let i = 0; i < window.localStorage.length; i++) {
        const key = window.localStorage.key(i);
        if (!key?.startsWith(SHEET_PREFIX) || key === LIST_KEY || values.has(key)) continue;
        const id = key.slice(SHEET_PREFIX.length);
        if (values.has(tombstoneKey(id))) continue;
        try {
          values.set(
            key,
            normalizeLegacySheet(JSON.parse(window.localStorage.getItem(key) ?? 'null'), id),
          );
        } catch {
          warnings.push(`${key} needs original-record recovery and was not included.`);
        }
      }
    } catch {
      warnings.push('Original localStorage records could not be read.');
    }
  }
  // Include current in-memory edits, including ones whose persistence failed.
  for (const [id, store] of cache ?? []) {
    const value = snapshotState(get(store));
    if (value && !values.has(tombstoneKey(id))) {
      try {
        values.set(`${SHEET_PREFIX}${id}`, normalizeLegacySheet(value, id));
      } catch {
        /* Empty loading placeholders are not sheets. */
      }
    }
  }
  const sheets = new Map<string, unknown>();
  for (const [key, value] of values) {
    if (!key.startsWith(SHEET_PREFIX) || key === LIST_KEY) continue;
    try {
      const id = key.slice(SHEET_PREFIX.length);
      if (!values.has(tombstoneKey(id))) sheets.set(id, normalizeLegacySheet(value, id));
    } catch {
      warnings.push(`${key} needs original-record recovery and was not included.`);
    }
  }
  return { sheets, values, warnings };
}

export async function exportBackup(
  options: {
    ids?: string[];
    game?: boolean;
    cache?: SheetCache;
    origin?: string | null;
    database?: UseStore;
  } = {},
) {
  const { sheets, values, warnings } = await collectBackupData(options.cache, options.database);
  const origin =
    options.origin === undefined
      ? typeof window === 'undefined'
        ? null
        : window.location.origin
      : options.origin;
  if (!options.ids) {
    for (const [id, raw] of sheets) {
      try {
        await encodeSheet(raw, new ExportContext(origin), id);
      } catch {
        sheets.delete(id);
        warnings.push(
          `${id} could not be included. Download a private recovery archive to preserve its original data.`,
        );
      }
    }
  }
  const roots = options.ids ?? [...sheets.keys()];
  if (!roots.length && !options.game)
    throw new Error(
      'There are no readable characters to export. Use original-record recovery if sheets are missing.',
    );
  const encoded = roots.length ? await buildBundle(sheets, roots, origin) : null;
  warnings.push(...(encoded?.warnings ?? []));
  if (encoded?.bundle.unresolvedRelations.length)
    warnings.push(
      'Some companions are missing. This backup is incomplete; missing links will be shown on restore.',
    );
  let payload: SheetBundleV1 | BrowserBackupV1;
  if (options.game) {
    const context = new ExportContext(origin);
    const gameData: GameEntry[] = [];
    for (const key of GAME_KEYS) {
      if (!values.has(key)) continue;
      const previousAssets = new Set(context.assets.keys());
      try {
        const data = await encodeGameData(new Map([[key, values.get(key)]]), context);
        // Validate each category before including it; one bad category cannot hide the other backups.
        await validateBrowserBackup({
          format: 'brighter-worlds.browser-backup',
          version: 1,
          id: 'check',
          exportedAt: 0,
          characters: null,
          gameData: data,
          assets: [...context.assets.values()],
        });
        gameData.push(...data);
      } catch {
        for (const id of context.assets.keys())
          if (!previousAssets.has(id)) context.assets.delete(id);
        warnings.push(
          `${key} could not be exported. Its original data was kept; this game backup is incomplete.`,
        );
      }
    }
    warnings.push(...context.warnings);
    payload = {
      format: 'brighter-worlds.browser-backup',
      version: 1,
      id: crypto.randomUUID(),
      exportedAt: Date.now(),
      characters: encoded?.bundle ?? null,
      gameData,
      assets: [...context.assets.values()],
    };
    await validateBrowserBackup(payload);
    if (!payload.characters && !payload.gameData.length)
      throw new Error(
        'No readable game data was found. Download a private recovery archive if data needs attention.',
      );
  } else payload = encoded!.bundle;
  const json = JSON.stringify(payload, null, 2);
  if (utf8Size(json) > MAX_BACKUP_BYTES)
    throw new Error(
      'This backup is too large. Export smaller character groups or recover originals separately.',
    );
  return { json, warnings: [...new Set(warnings)], payload };
}

async function readInput(text: string): Promise<{
  bundle: SheetBundleV1 | null;
  game: GameEntry[];
  gameAssets: Map<string, Blob>;
  sheetAssets: Map<string, Blob>;
  warnings: string[];
}> {
  if (utf8Size(text) > MAX_BACKUP_BYTES) throw new Error('Backup files must be at most 16 MiB.');
  const input: unknown = JSON.parse(text);
  bounded(input);
  const value = record(input);
  let bundle: SheetBundleV1 | null = null;
  let game: GameEntry[] = [];
  let gameAssets = new Map<string, Blob>();
  const warnings: string[] = [];
  if (value.format === 'brighter-worlds.browser-backup') {
    gameAssets = await validateBrowserBackup(value);
    const backup = value as unknown as BrowserBackupV1;
    bundle = backup.characters;
    game = backup.gameData;
  } else if (value.format === 'brighter-worlds.bundle') {
    await validateBundle(value);
    bundle = value as unknown as SheetBundleV1;
  } else if (value.format === 'brighter-worlds.sheet') {
    assertSheet(value);
    bundle = {
      format: 'brighter-worlds.bundle',
      version: 1,
      id: `file_${(await contentHash(value)).slice(0, 32)}`,
      exportedAt: 0,
      source: { origin: null, storage: 'file' },
      roots: [value.id],
      sheets: [value],
      assets: [],
      unresolvedRelations: value.relations.map((x) => ({
        sheetId: value.id,
        abilityId: x.abilityId,
        targetSheetId: x.sheetId,
      })),
    };
  } else if (value.format === 'brighter-worlds.private-recovery' && value.version === 1) {
    if (!Array.isArray(value.records) || value.records.length > 1000)
      throw new Error('Invalid private recovery file.');
    const records = new Map<string, unknown>();
    for (const row of value.records) {
      const saved = record(row);
      if (
        typeof saved.key !== 'string' ||
        !saved.key.startsWith(SHEET_PREFIX) ||
        saved.key === LIST_KEY ||
        typeof saved.raw !== 'string'
      )
        continue;
      const id = saved.key.slice(SHEET_PREFIX.length);
      try {
        if (records.has(id)) throw new Error('Duplicate recovered ID.');
        records.set(id, normalizeLegacySheet(JSON.parse(saved.raw), id));
      } catch {
        warnings.push(`${saved.key} remains in the original file and needs manual recovery.`);
      }
    }
    if (!records.size)
      throw new Error(
        'No readable sheets were found in this recovery file. Original file was not changed.',
      );
    const encoded = await buildBundle(records, [...records.keys()], null);
    bundle = encoded.bundle;
    bundle.source.storage = 'file';
    warnings.push(...encoded.warnings);
  } else {
    if (value.format === 'brighter-worlds.private-recovery')
      throw new Error(
        'This private archive preserves original data for manual recovery. Choose a portable backup for ordinary restore.',
      );
    if ('format' in value || 'version' in value)
      throw new Error('Unsupported backup format or version. No records were changed.');
    const id = validSheetId(value.id)
      ? value.id
      : `legacy_${(await contentHash(value)).slice(0, 32)}`;
    const sheet = normalizeLegacySheet(value, id);
    const encoded = await buildBundle(new Map([[id, sheet]]), [id], null);
    bundle = encoded.bundle;
    bundle.source.storage = 'file';
    warnings.push(...encoded.warnings);
  }
  const sheetAssets = bundle ? await validateBundle(bundle) : new Map<string, Blob>();
  if (bundle?.unresolvedRelations.length)
    warnings.push(
      `${bundle.unresolvedRelations.length} companion link(s) are unresolved. Those links will remain visibly unavailable.`,
    );
  if (!bundle && !game.length) throw new Error('This backup contains no restorable records.');
  return { bundle, game, gameAssets, sheetAssets, warnings };
}

async function importDigest(input: Awaited<ReturnType<typeof readInput>>) {
  const bundle = input.bundle;
  const gameImages = await Promise.all(
    [...input.gameAssets].map(async ([id, blob]) => ({
      id,
      mediaType: blob.type,
      byteLength: blob.size,
      sha256: await hash(new Uint8Array(await blob.arrayBuffer())),
    })),
  );
  return contentHash({
    characters: bundle
      ? {
          source: bundle.source,
          roots: bundle.roots,
          sheets: bundle.sheets,
          assets: bundle.assets.map(({ data: _, ...asset }) => asset),
          unresolvedRelations: bundle.unresolvedRelations,
        }
      : null,
    game: input.game,
    assets: gameImages,
  });
}

/** Validation and collision preview perform no writes. */
export async function prepareBackup(
  text: string,
  database: UseStore = sheetDatabase,
): Promise<PreparedBackup> {
  const input = await readInput(text);
  const snapshots = new Map<string, unknown>(
    (await entries<IDBValidKey, unknown>(database)).filter(([key]) => typeof key === 'string') as [
      string,
      unknown,
    ][],
  );
  const statuses: PreparedBackup['statuses'] = [];
  for (const document of input.bundle?.sheets ?? []) {
    const existing = snapshots.get(`${SHEET_PREFIX}${document.id}`);
    let state: 'new' | 'same' | 'conflict' = snapshots.has(tombstoneKey(document.id))
      ? 'conflict'
      : existing === undefined
        ? 'new'
        : 'conflict';
    if (existing !== undefined && state === 'conflict') {
      try {
        // Binary destinations are conservatively copied, never assumed unchanged by a metadata-only comparison.
        localFingerprint(existing);
        const current = await encodeSheet(
          existing,
          new ExportContext(input.bundle!.source.origin),
          document.id,
        );
        if (
          canonical(current.document) === canonical(document) &&
          !snapshots.has(tombstoneKey(document.id))
        )
          state = 'same';
      } catch {
        /* A damaged destination is also kept, not overwritten. */
      }
    }
    statuses.push({ id: document.id, name: document.character.name, state });
  }
  const digest = await importDigest(input);
  return {
    ...input,
    warnings: [...new Set(input.warnings)],
    statuses,
    snapshots,
    digest,
    originalText: text,
    existingGame: input.game.filter((x) => snapshots.has(x.key)).map((x) => x.key),
  };
}

export async function restoreBackup(
  prepared: PreparedBackup,
  policy: CollisionPolicy = 'copy',
  replaceGame = false,
  database: UseStore = sheetDatabase,
  newTransferId?: string,
) {
  if (newTransferId !== undefined && !validSheetId(newTransferId))
    throw new Error('Invalid transfer ID.');
  // Revalidate the original bytes so caller mutations cannot bypass the preview contract.
  const fresh = await readInput(prepared.originalText);
  const digest = await importDigest(fresh);
  if (digest !== prepared.digest)
    throw new Error('The backup changed after preview. Select the file again.');
  const receiptKey = `bw-transfer:v1:${prepared.digest}:${policy}:${replaceGame ? 'replace' : 'keep'}:${newTransferId ?? 'default'}`;
  const copyGraph =
    policy === 'copy' &&
    (newTransferId !== undefined || prepared.statuses.some((x) => x.state === 'conflict'));
  const idMap = new Map(
    (fresh.bundle?.sheets ?? []).map((x) => [x.id, copyGraph ? crypto.randomUUID() : x.id]),
  );
  const included = new Set(
    prepared.statuses.filter((x) => copyGraph || x.state !== 'conflict').map((x) => x.id),
  );
  const restoreOrder = Date.now();
  const usedNames = new Set(
    [...prepared.snapshots.entries()]
      .filter(([key]) => key.startsWith(SHEET_PREFIX) && key !== LIST_KEY)
      .map(([, value]) => (value as { name?: unknown } | null)?.name)
      .filter((name): name is string => typeof name === 'string'),
  );
  for (const document of fresh.bundle?.sheets ?? []) usedNames.add(document.character.name);
  function copyName(name: string) {
    const base = Array.from(name || 'Unnamed character');
    for (let number = 1; ; number++) {
      const suffix = number === 1 ? ' (copy)' : ` (copy ${number})`;
      const candidate = base.slice(0, 512 - suffix.length).join('') + suffix;
      if (!usedNames.has(candidate)) {
        usedNames.add(candidate);
        return candidate;
      }
    }
  }
  const sheets = (fresh.bundle?.sheets ?? [])
    .filter((x) => included.has(x.id))
    .map((document, index) => {
      const value = hydrateSheet(
        document,
        fresh.sheetAssets,
        idMap,
        included,
        fresh.bundle?.unresolvedRelations,
      );
      if (copyGraph) value.name = copyName(value.name);
      value.sortkey = restoreOrder + index;
      return { document, value };
    });
  const gameValues = fresh.game.map((entry) => ({
    entry,
    value: hydrateGameEntry(entry, fresh.gameAssets),
  }));
  return transaction(
    'readwrite',
    async (store) => {
      const oldReceipt = await request(store.get(receiptKey));
      if (oldReceipt) {
        if (!Array.isArray(oldReceipt))
          throw new Error('A transfer receipt is damaged. Existing records were kept.');
        return (oldReceipt as ImportOutcome[]).map((x) => ({
          ...x,
          outcome: 'already-processed' as const,
        }));
      }
      const outcomes: ImportOutcome[] = [];
      for (const status of prepared.statuses) {
        if (!included.has(status.id))
          outcomes.push({ id: status.id, name: status.name, outcome: 'kept-current' });
      }
      for (const { document, value } of sheets) {
        const key = `${SHEET_PREFIX}${value.id}`;
        const current = await request(store.get(key));
        if (!copyGraph && prepared.statuses.find((x) => x.id === document.id)?.state === 'same') {
          if (localFingerprint(current) !== localFingerprint(prepared.snapshots.get(key)))
            throw new Error('A sheet changed after preview. Select the file again.');
          outcomes.push({
            id: document.id,
            destinationId: value.id,
            name: value.name,
            outcome: 'already-present',
          });
          continue;
        }
        if (current !== undefined || (await request(store.get(tombstoneKey(value.id)))))
          throw new Error('A destination changed after preview. Select the file again.');
        store.add(value, key);
        const readback = await request(store.get(key));
        if (readback?.id !== value.id) throw new Error('Restored sheet verification failed.');
        outcomes.push({
          id: document.id,
          destinationId: value.id,
          name: value.name,
          outcome: 'restored',
        });
      }
      for (const { entry, value } of gameValues) {
        const current = await request(store.get(entry.key));
        if (current !== undefined && !replaceGame) {
          outcomes.push({ id: entry.key, name: entry.key, outcome: 'kept-current' });
          continue;
        }
        // A stale preview must not replace newly edited libraries. Blob-bearing existing libraries are kept.
        if (localFingerprint(current) !== localFingerprint(prepared.snapshots.get(entry.key)))
          throw new Error(
            'Game data changed after preview or contains binary data. Keep current data or restore into an empty browser profile.',
          );
        if (current !== undefined)
          store.put(
            { version: 1, key: entry.key, value: current },
            `bw-recovery:v1:before-import:${prepared.digest}:${entry.key}`,
          );
        store.put(value, entry.key);
        await request(store.get(entry.key));
        outcomes.push({ id: entry.key, name: entry.key, outcome: 'restored' });
      }
      // Original bytes are local-only recovery data and never part of a future portable export.
      store.put(
        { version: 1, raw: prepared.originalText },
        `bw-recovery:v1:import:${prepared.digest}`,
      );
      store.put(outcomes, receiptKey);
      return outcomes;
    },
    database,
  );
}

export async function downloadCharacterBundle(id: string, cache?: SheetCache) {
  const result = await exportBackup({ ids: [id], cache });
  download(result.json, 'brighter-worlds-character.json');
  return result.warnings;
}
