import 'fake-indexeddb/auto';
import { createStore, entries, get, set, type UseStore } from 'idb-keyval';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { writable } from 'svelte/store';
import root from './sheet-format/fixtures/legacy-root.json';
import dev from './sheet-format/fixtures/legacy-dev.json';
import expectedRoot from './sheet-format/fixtures/sheet-v1.json';
import expectedDev from './sheet-format/fixtures/sheet-dev-v1.json';
import fixture from './sheet-format/fixtures/bundle-v1.json';
import {
  buildBundle,
  canonical,
  contentHash,
  encodeSheet,
  ExportContext,
  hydrateSheet,
  readAssets,
  validateBundle,
} from './sheet-format/codec';
import { exportBackup, prepareBackup, restoreBackup } from './sheet-backup';
import { normalizeLegacySheet } from './legacy-sheet';
import { tombstoneKey } from './sheet-recovery';

let db: UseStore;
beforeEach(() => {
  db = createStore(`backup-${crypto.randomUUID()}`, 'keyval');
});
afterEach(() => vi.unstubAllGlobals());
const json = JSON.stringify(fixture);
const runtime = (name = 'Mara') => ({ ...normalizeLegacySheet(root, root.id), name });

describe('portable conversion and attachment validation', () => {
  it.each([
    [root, expectedRoot],
    [dev, expectedDev],
  ])(
    'normalizes historical fixtures to their exact documented v1 outputs',
    async (source, expected) => {
      const before = structuredClone(source);
      const result = await encodeSheet(source, new ExportContext('https://dev.brighterworlds.app'));
      expect(result.document).toEqual(expected);
      expect(source).toEqual(before);
      expect(JSON.stringify(result.document)).not.toContain(root.settings.discordWebhook);
    },
  );
  it('round-trips native Sets, legacy rules and nested magic through hydration', async () => {
    const sheet = hydrateSheet(expectedDev as never, new Map(), new Map(), new Set());
    expect(sheet.statuses).toEqual(new Set(dev.statuses));
    const encoded = await encodeSheet(sheet, new ExportContext(null));
    expect(encoded.document).toEqual(expectedDev);
  });
  it('restores byte-identical Blob images and exports them without a storage write', async () => {
    const images = await validateBundle(fixture);
    const companion = hydrateSheet(fixture.sheets[1] as never, images, new Map(), new Set());
    const encoded = await buildBundle(new Map([[companion.id, companion]]), [companion.id], null);
    const bytes = await readAssets(encoded.bundle.assets);
    const original = images.get('pip_portrait')!;
    const copied = [...bytes.values()][0];
    expect(await copied.arrayBuffer()).toEqual(await original.arrayBuffer());
  });
  it('rejects a corrupt attachment before any destination writes', async () => {
    const broken = structuredClone(fixture);
    broken.assets[0].sha256 = '0'.repeat(64);
    await expect(prepareBackup(JSON.stringify(broken), db)).rejects.toThrow('checksum');
    expect(await entries(db)).toEqual([]);
  });
  it.each([
    ['future version', { ...fixture, version: 2 }],
    ['duplicate document IDs', { ...fixture, sheets: [fixture.sheets[0], fixture.sheets[0]] }],
    ['missing image', { ...fixture, assets: [] }],
    ['undeclared missing companion', { ...fixture, sheets: [fixture.sheets[0]] }],
  ])('rejects %s without touching storage', async (_, input) => {
    await expect(prepareBackup(JSON.stringify(input), db)).rejects.toThrow();
    expect(await entries(db)).toEqual([]);
  });
  it('keeps companion traversal finite for a cycle between sheets', async () => {
    const first = runtime();
    const second = runtime('Pip');
    second.id = 'pip_01';
    second.abilities = [
      { id: 'back', name: 'Mara', type: 'companion', companionSheetId: 'hero_01' },
    ];
    const { bundle } = await buildBundle(
      new Map([
        [first.id, first],
        [second.id, second],
      ]),
      [first.id],
      null,
    );
    expect(bundle.sheets).toHaveLength(2);
  });
  it('refuses unresolved or unsafe image representations instead of silently serializing empty objects', async () => {
    const source = runtime();
    source.calling.image = new Blob(['<svg/>'], { type: 'image/svg+xml' });
    await expect(encodeSheet(source, new ExportContext(null))).rejects.toThrow('raster');
  });
});

describe('preview, atomic restore and retry', () => {
  it('previews without writes, then restores linked characters with all relations and images', async () => {
    const prepared = await prepareBackup(json, db);
    expect(prepared.statuses.map((x) => x.state)).toEqual(['new', 'new']);
    expect(await entries(db)).toEqual([]);
    const result = await restoreBackup(prepared, 'copy', false, db);
    expect(result.every((x) => x.outcome === 'restored')).toBe(true);
    const parent = await get('bw-sheet-hero_01', db);
    expect(parent.abilities[0].companionSheetId).toBe('pip_01');
    expect(parent.abilities[0].desc).toBe("Pip's Sheet");
    expect(parent.settings).toBeUndefined();
    expect((await get('bw-sheet-pip_01', db)).calling.image).toBeInstanceOf(Blob);
  });
  it('copies an entire conflicting graph with new IDs and retains the current sheet', async () => {
    await set('bw-sheet-hero_01', runtime('Current character'), db);
    const prepared = await prepareBackup(json, db);
    const result = await restoreBackup(prepared, 'copy', false, db);
    const map = new Map(result.map((x) => [x.id, x.destinationId]));
    expect(map.get('hero_01')).not.toBe('hero_01');
    expect(map.get('pip_01')).not.toBe('pip_01');
    const parent = await get(`bw-sheet-${map.get('hero_01')}`, db);
    expect(parent.name).toBe('Mara (copy)');
    expect((await get(`bw-sheet-${map.get('pip_01')}`, db)).name).toBe('Pip (copy)');
    expect(result.find((x) => x.id === 'hero_01')?.name).toBe('Mara (copy)');
    expect(parent.abilities[0].companionSheetId).toBe(map.get('pip_01'));
    expect((await get('bw-sheet-hero_01', db)).name).toBe('Current character');
  });
  it('keeps same-name sheets with different IDs separate without treating their names as conflicts', async () => {
    await set('bw-sheet-unrelated', { ...runtime(), id: 'unrelated' }, db);
    const prepared = await prepareBackup(json, db);
    expect(prepared.statuses.every((x) => x.state === 'new')).toBe(true);
    await restoreBackup(prepared, 'copy', false, db);
    expect((await get('bw-sheet-hero_01', db)).name).toBe('Mara');
    expect((await get('bw-sheet-unrelated', db)).name).toBe('Mara');
  });
  it('numbers additional copies and keeps long copied names exportable', async () => {
    await set('bw-sheet-hero_01', runtime('Current'), db);
    await set('bw-sheet-existing_copy', { ...runtime('Mara (copy)'), id: 'existing_copy' }, db);
    const result = await restoreBackup(await prepareBackup(json, db), 'copy', false, db);
    const copied = await get(
      `bw-sheet-${result.find((x) => x.id === 'hero_01')!.destinationId}`,
      db,
    );
    expect(copied.name).toBe('Mara (copy 2)');
    const long = structuredClone(fixture);
    long.sheets[0].character.name = '🌟'.repeat(512);
    const again = await restoreBackup(
      await prepareBackup(JSON.stringify(long), db),
      'copy',
      false,
      db,
    );
    const longCopy = await get(
      `bw-sheet-${again.find((x) => x.id === 'hero_01')!.destinationId}`,
      db,
    );
    expect(Array.from(longCopy.name)).toHaveLength(512);
    expect(longCopy.name.endsWith(' (copy)')).toBe(true);
    await expect(
      encodeSheet(longCopy, new ExportContext(null), longCopy.id),
    ).resolves.toBeDefined();
  });
  it('uses durable receipts after a lost acknowledgment and never resets later edits', async () => {
    await set('bw-sheet-hero_01', runtime('Current'), db);
    const first = await restoreBackup(await prepareBackup(json, db), 'copy', false, db);
    const copied = first.find((x) => x.id === 'hero_01')!.destinationId!;
    const edited = await get(`bw-sheet-${copied}`, db);
    edited.name = 'Later edit';
    await set(`bw-sheet-${copied}`, edited, db);
    const retry = await restoreBackup(await prepareBackup(json, db), 'copy', false, db);
    expect(retry[0].outcome).toBe('already-processed');
    expect((await get(`bw-sheet-${copied}`, db)).name).toBe('Later edit');
    expect((await entries<string>(db)).filter(([key]) => key.startsWith('bw-sheet-'))).toHaveLength(
      3,
    );
  });
  it('keeps idempotency when the same content is exported again with new transfer metadata', async () => {
    await restoreBackup(await prepareBackup(json, db), 'copy', false, db);
    const another = { ...fixture, id: 'another_export', exportedAt: fixture.exportedAt + 1 };
    expect(
      (await restoreBackup(await prepareBackup(JSON.stringify(another), db), 'copy', false, db))[0]
        .outcome,
    ).toBe('already-processed');
  });
  it('supports an explicit fresh linked copy after a previous restore', async () => {
    await restoreBackup(await prepareBackup(json, db), 'copy', false, db);
    const fresh = await restoreBackup(
      await prepareBackup(json, db),
      'copy',
      false,
      db,
      'new_operation',
    );
    expect(fresh.every((x) => x.destinationId !== x.id)).toBe(true);
  });
  it('does not overwrite a destination created after preview', async () => {
    const prepared = await prepareBackup(json, db);
    await set('bw-sheet-hero_01', runtime('Concurrent change'), db);
    await expect(restoreBackup(prepared, 'copy', false, db)).rejects.toThrow(
      'changed after preview',
    );
    expect((await get('bw-sheet-hero_01', db)).name).toBe('Concurrent change');
    expect(await get('bw-sheet-pip_01', db)).toBeUndefined();
  });
  it('rolls back partial sheet writes, archives and receipts on quota failure', async () => {
    const prepared = await prepareBackup(json, db);
    const failing: UseStore = (mode, callback) =>
      db(mode, (store) => {
        const original = store.add.bind(store);
        store.add = ((value: unknown, key?: IDBValidKey) => {
          if (key === 'bw-sheet-pip_01') throw new DOMException('Quota', 'QuotaExceededError');
          return original(value, key);
        }) as IDBObjectStore['add'];
        return callback(store);
      });
    await expect(restoreBackup(prepared, 'copy', false, failing)).rejects.toThrow('Quota');
    expect(await entries(db)).toEqual([]);
    expect(await restoreBackup(prepared, 'copy', false, db)).toHaveLength(2);
  });
  it('can skip a conflicting companion without attaching a different local sheet', async () => {
    await set('bw-sheet-pip_01', { ...runtime('Unrelated'), id: 'pip_01', abilities: [] }, db);
    const prepared = await prepareBackup(json, db);
    await restoreBackup(prepared, 'skip', false, db);
    const parent = await get('bw-sheet-hero_01', db);
    expect(parent.abilities[0].companionSheetId).toBeUndefined();
    expect(parent.abilities[0].unresolvedCompanionId).toBe('pip_01');
    const exported = await exportBackup({ game: true, database: db, origin: null });
    expect(exported.payload).toHaveProperty('characters.unresolvedRelations');
  });
  it('explicitly imports a deleted character as a new copy without clearing its tombstone', async () => {
    await set(tombstoneKey('hero_01'), { deletedAt: 1 }, db);
    const result = await restoreBackup(await prepareBackup(json, db), 'copy', false, db);
    expect(result.find((x) => x.id === 'hero_01')?.destinationId).not.toBe('hero_01');
    expect(await get(tombstoneKey('hero_01'), db)).toEqual({ deletedAt: 1 });
  });
  it('sanitizes imported HTML and keeps the complete original file only in local recovery', async () => {
    const source = structuredClone(root);
    source.abilities[0].desc = '<p onclick="evil()">A note<script>evil()</script></p>';
    const text = JSON.stringify(source);
    await restoreBackup(await prepareBackup(text, db), 'copy', false, db);
    const saved = await get('bw-sheet-hero_01', db);
    expect(saved.abilities[0].desc).toBe('<p>A note</p>');
    expect(saved.settings).toBeUndefined();
    const archived = (await entries<string, { raw?: string }>(db)).filter(([key]) =>
      key.startsWith('bw-recovery:'),
    );
    expect(archived.some(([, value]) => value.raw === text)).toBe(true);
  });
  it('can restore a legacy file with no ID and safely retry it', async () => {
    const { id: _, ...source } = root;
    const text = JSON.stringify(source);
    const first = await restoreBackup(await prepareBackup(text, db), 'copy', false, db);
    const retry = await restoreBackup(await prepareBackup(text, db), 'copy', false, db);
    expect(retry[0].destinationId).toBe(first[0].destinationId);
    expect(retry[0].outcome).toBe('already-processed');
  });
});

describe('read-only exports and broader game backups', () => {
  it('exports an original fixture without writes or private settings', async () => {
    await set('bw-sheet-hero_01', runtime(), db);
    const readonly: UseStore = (mode, callback) => {
      expect(mode).toBe('readonly');
      return db(mode, callback);
    };
    const exported = await exportBackup({ database: readonly, origin: null });
    expect(exported.json).not.toContain(root.settings.discordWebhook);
    expect(exported.json).not.toContain('unknownLegacyField');
    expect(exported.warnings.length).toBeGreaterThan(0);
  });
  it('exports in-memory unsaved edits even when storage reads fail', async () => {
    const unavailable: UseStore = async () => {
      throw new Error('Denied');
    };
    const sheet = runtime('Unsaved draft');
    const cache = new Map([
      [
        sheet.id,
        {
          ...writable(sheet),
          loaded: Promise.resolve(),
          set: async () => {},
          update: async () => {},
        },
      ],
    ]);
    const exported = await exportBackup({ database: unavailable, cache, origin: null });
    expect(exported.json).toContain('Unsaved draft');
    expect(exported.warnings.join(' ')).toContain('unavailable');
  });
  it('restores scenes, friends, tables, playmat, encounters and display-only logs', async () => {
    const scene = {
      id: 'scene_01',
      name: 'Camp',
      desc: 'Quiet',
      gmnotes: 'Secret path',
      settings: { discordWebhook: 'do-not-export' },
    };
    const npc = {
      id: 'npc_01',
      name: 'Fox',
      grit: 3,
      str: 4,
      dex: 6,
      wil: 4,
      notes: [],
      attacks: [],
    };
    const instance = {
      ...npc,
      armor: 0,
      status: '',
      grit: { current: 0, max: 3 },
      str: { current: 4, max: 4 },
      dex: { current: 6, max: 6 },
      wil: { current: 4, max: 4 },
    };
    const game = new Map<string, unknown>([
      ['bw-gm-npcs', [npc]],
      ['bw-gm-relics', [{ id: 'relic_01', name: 'Ember', damage: 6 }]],
      ['bw-gm-scenes', [scene]],
      ['bw-encounters', [{ id: 'enc_01', name: 'Camp visitors', desc: '', npcs: [npc] }]],
      ['bw-playmat', [{ id: 'mat_01', type: 'npc', npc: instance }]],
      [
        'bw-gm-tables',
        [
          {
            id: 'table_01',
            name: 'Finds',
            formula: 'd6',
            options: [{ type: 'entity', trigger: [1, 6], value: npc }],
          },
        ],
      ],
      [
        'bw-gm-friends',
        {
          id: 'default',
          die: 4,
          slots: [{ id: 'friend_01', index: 0, name: 'Fox', sourceNpcId: 'npc_01' }],
        },
      ],
      [
        'bw-rolllog2',
        {
          ids: new Set(['roll_01']),
          list: [
            {
              id: 'roll_01',
              name: 'Roll',
              type: 'roll',
              time: new Date(1000),
              roll: { dice: [6], result: 4 },
            },
          ],
        },
      ],
      [
        'bw-player-log',
        {
          ids: new Set(['event_01']),
          list: [
            {
              id: 'event_01',
              name: 'Mara',
              type: 'embed',
              embed: { fields: [], cta: [{ secret: 'do-not-export' }], meta: 'do-not-export' },
            },
          ],
        },
      ],
      ['bw-encounters-settings', { discordWebhook: 'do-not-export' }],
    ]);
    for (const [key, value] of game) await set(key, value, db);
    const exported = await exportBackup({ game: true, database: db, origin: null });
    expect(exported.json).not.toContain('do-not-export');
    const target = createStore(`restored-${crypto.randomUUID()}`, 'keyval');
    const prepared = await prepareBackup(exported.json, target);
    expect(prepared.game).toHaveLength(9);
    await restoreBackup(prepared, 'copy', false, target);
    expect((await get('bw-gm-npcs', target))[0].name).toBe('Fox');
    expect((await get('bw-gm-relics', target))[0].name).toBe('Ember');
    expect((await get('bw-gm-scenes', target))[0].gmnotes).toBe('Secret path');
    expect((await get('bw-playmat', target))[0].npc.grit.current).toBe(0);
    expect((await get('bw-gm-tables', target))[0].options[0].value.name).toBe('Fox');
    expect((await get('bw-rolllog2', target)).ids).toEqual(new Set(['roll_01']));
    expect((await get('bw-rolllog2', target)).list[0].time).toBe(1000);
    expect((await get('bw-player-log', target)).list[0].embed.cta).toBeUndefined();
  });
  it('keeps existing game categories unless replacement is explicitly selected, and archives replacements', async () => {
    await set('bw-gm-scenes', [{ id: 'scene_01', name: 'Backup scene' }], db);
    const exported = await exportBackup({ game: true, database: db, origin: null });
    const target = createStore(`replace-${crypto.randomUUID()}`, 'keyval');
    await set('bw-gm-scenes', [{ id: 'existing', name: 'Existing scene' }], target);
    const prepared = await prepareBackup(exported.json, target);
    expect((await restoreBackup(prepared, 'copy', false, target))[0].outcome).toBe('kept-current');
    expect((await get('bw-gm-scenes', target))[0].name).toBe('Existing scene');
    await restoreBackup(prepared, 'copy', true, target);
    expect((await get('bw-gm-scenes', target))[0].name).toBe('Backup scene');
    const archives = (await entries<string, { value?: unknown }>(target)).filter(([key]) =>
      key.startsWith('bw-recovery:v1:before-import:'),
    );
    expect(archives[0][1].value).toEqual([{ id: 'existing', name: 'Existing scene' }]);
  });
});

it('archives game data unchanged when the preview becomes stale', async () => {
  await set('bw-gm-scenes', [{ id: 's', name: 'Backup' }], db);
  const backup = await exportBackup({ game: true, database: db, origin: null });
  const prepared = await prepareBackup(backup.json, db);
  await set('bw-gm-scenes', [{ id: 's', name: 'Changed after preview' }], db);
  await expect(restoreBackup(prepared, 'copy', true, db)).rejects.toThrow('changed after preview');
  expect((await get('bw-gm-scenes', db))[0].name).toBe('Changed after preview');
});

it('prevents two tabs restoring the same file from creating duplicate copied groups', async () => {
  await set('bw-sheet-hero_01', runtime('Existing'), db);
  const first = await prepareBackup(json, db);
  const second = await prepareBackup(json, db);
  const results = await Promise.all([
    restoreBackup(first, 'copy', false, db),
    restoreBackup(second, 'copy', false, db),
  ]);
  expect(results.flat().some((x) => x.outcome === 'already-processed')).toBe(true);
  expect((await entries<string>(db)).filter(([key]) => key.startsWith('bw-sheet-'))).toHaveLength(
    3,
  );
});

it('preserves the bundle sheet order using distinct local sort keys', async () => {
  const outcomes = await restoreBackup(await prepareBackup(json, db), 'copy', false, db);
  const first = await get(`bw-sheet-${outcomes[0].destinationId}`, db);
  const second = await get(`bw-sheet-${outcomes[1].destinationId}`, db);
  expect(second.sortkey).toBeGreaterThan(first.sortkey);
});

it.each([
  '<p onclick="evil()">Text<script>evil()</script></p>',
  '<a href="javascript:evil()">Text</a>',
  '<svg onload="evil()"><script>evil()</script></svg>',
  '<p style="background:url(javascript:evil())">Text</p>',
])('removes active imported markup before rendering: %s', async (desc) => {
  const { sanitizeDescription } = await import('$lib/util/sanitize-html');
  expect(sanitizeDescription(desc)).not.toMatch(/<script|javascript:|onclick|onload|style=/i);
});

it('rejects oversized input before reading destination storage', async () => {
  let read = false;
  const unused: UseStore = async () => {
    read = true;
    throw new Error('Must not read');
  };
  await expect(prepareBackup(' '.repeat(16 * 1024 * 1024 + 1), unused)).rejects.toThrow('16 MiB');
  expect(read).toBe(false);
});
