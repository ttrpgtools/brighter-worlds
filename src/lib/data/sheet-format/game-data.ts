import {
  validationErrors,
  webURL,
  bounded,
  ExportContext,
  hydrateTree,
  readAssets,
  validateBundle,
} from './codec';
import { record } from '../legacy-sheet';
import { validateGame } from './compiled-validators.js';
import type { BundleAssetV1, SheetBundleV1 } from './types';

export const GAME_KEYS = [
  'bw-gm-npcs',
  'bw-gm-relics',
  'bw-encounters',
  'bw-playmat',
  'bw-gm-scenes',
  'bw-gm-tables',
  'bw-gm-friends',
  'bw-rolllog2',
  'bw-player-log',
] as const;
export type GameKey = (typeof GAME_KEYS)[number];
export interface GameEntry {
  key: GameKey;
  value: unknown;
}
export interface BrowserBackupV1 {
  format: 'brighter-worlds.browser-backup';
  version: 1;
  id: string;
  exportedAt: number;
  characters: SheetBundleV1 | null;
  gameData: GameEntry[];
  assets: BundleAssetV1[];
}

export async function encodeGameData(
  values: Map<string, unknown>,
  context: ExportContext,
): Promise<GameEntry[]> {
  const list = (x: unknown) => {
    if (!Array.isArray(x)) throw new Error('Invalid game data list.');
    return x;
  };
  const map = async (x: unknown, fn: (x: unknown, i: number) => Promise<unknown>) =>
    Promise.all(list(x).map(fn));
  async function entity(x: unknown, kind: string, path: string): Promise<Record<string, unknown>> {
    const raw = record(x);
    const keys = [
      'id',
      'name',
      'desc',
      'image',
      'icon',
      ...(kind === 'scene' ? ['gmnotes'] : []),
      ...(['npc', 'instance'].includes(kind)
        ? [
            'armor',
            'notes',
            'wants',
            'found',
            'str',
            'dex',
            'wil',
            'grit',
            'attacks',
            ...(kind === 'instance' ? ['status'] : []),
          ]
        : []),
      ...(kind === 'encounter' ? ['npcs'] : []),
      ...(kind === 'table' ? ['formula', 'options'] : []),
    ];
    const result = context.project(raw, keys, path);
    if (result.image !== undefined && result.image !== '')
      result.image = await context.image(result.image);
    else delete result.image;
    if (kind === 'encounter')
      result.npcs = await map(raw.npcs, (n, i) => entity(n, 'npc', `${path}.npcs.${i}`));
    if (kind === 'npc' || kind === 'instance') {
      result.notes = raw.notes ?? [];
      result.attacks = await map(raw.attacks, (n, i) =>
        context.entity(n, `${path}.attacks.${i}`, 'item'),
      );
      if (kind === 'instance')
        for (const attr of ['str', 'dex', 'wil', 'grit'])
          result[attr] = context.project(raw[attr], ['current', 'max'], `${path}.${attr}`);
    }
    return result;
  }
  async function log(x: unknown, path: string) {
    const raw = record(x);
    const result = context.project(raw, ['id', 'name', 'type', 'time'], path, ['roll', 'embed']);
    if (raw.time instanceof Date) result.time = raw.time.getTime();
    if (raw.type === 'roll')
      result.roll = context.project(raw.roll, ['dice', 'result', 'label'], `${path}.roll`);
    else {
      const embed = context.project(
        raw.embed,
        ['title', 'description', 'author', 'footer', 'image', 'fields', 'color'],
        `${path}.embed`,
        ['cta', 'meta', 'url'],
      );
      if (embed.author !== undefined)
        embed.author = context.project(embed.author, ['name', 'icon_url'], `${path}.author`);
      if (embed.footer !== undefined)
        embed.footer = context.project(embed.footer, ['text', 'icon_url'], `${path}.footer`);
      if (embed.image !== undefined)
        embed.image = context.project(embed.image, ['url'], `${path}.image`);
      embed.fields = list(embed.fields ?? []).map((field, i) =>
        context.project(field, ['name', 'value', 'inline'], `${path}.fields.${i}`),
      );
      result.embed = embed;
    }
    return result;
  }
  const entries: GameEntry[] = [];
  for (const key of GAME_KEYS) {
    if (!values.has(key)) continue;
    const input = values.get(key);
    let value: unknown;
    if (key === 'bw-gm-npcs') value = await map(input, (x, i) => entity(x, 'npc', `${key}.${i}`));
    else if (key === 'bw-gm-relics')
      value = await map(input, (x, i) => context.entity(x, `${key}.${i}`, 'item'));
    else if (key === 'bw-encounters' || key === 'bw-gm-scenes')
      value = await map(input, (x, i) =>
        entity(x, key === 'bw-encounters' ? 'encounter' : 'scene', `${key}.${i}`),
      );
    else if (key === 'bw-playmat')
      value = await map(input, async (x, i) => {
        const raw = context.project(x, ['id', 'type', 'npc', 'scene', 'item'], `${key}.${i}`);
        const kind = raw.type as string;
        if (!['npc', 'scene', 'item'].includes(kind)) throw new Error('Invalid playmat entry.');
        return {
          id: raw.id,
          type: kind,
          [kind]:
            kind === 'item'
              ? await context.entity(raw[kind], `${key}.${i}.item`, 'item')
              : await entity(
                  raw[kind],
                  kind === 'npc' ? 'instance' : 'scene',
                  `${key}.${i}.${kind}`,
                ),
        };
      });
    else if (key === 'bw-gm-friends') {
      const roster = context.project(input, ['id', 'die', 'slots'], key);
      roster.slots = list(roster.slots).map((slot, i) =>
        context.project(slot, ['id', 'index', 'name', 'notes', 'sourceNpcId'], `${key}.${i}`),
      );
      value = roster;
    } else if (key === 'bw-gm-tables')
      value = await map(input, async (x, i) => {
        const raw = record(x);
        const table = {
          ...(await entity(x, 'table', `${key}.${i}`)),
          formula: raw.formula,
          options: undefined as unknown,
        };
        table.options = await map(raw.options, async (option, j) => {
          const row = context.project(
            option,
            ['type', 'trigger', 'value'],
            `${key}.${i}.options.${j}`,
          );
          if (row.type === 'entity') {
            const val = record(row.value);
            const kind =
              'npcs' in val
                ? 'encounter'
                : 'attacks' in val
                  ? 'npc'
                  : 'gmnotes' in val
                    ? 'scene'
                    : ['spell', 'ritual'].includes(val.type as string)
                      ? (val.type as string)
                      : 'item';
            row.value = {
              kind,
              data: ['item', 'spell', 'ritual'].includes(kind)
                ? await context.entity(val, `${key}.${i}.options.${j}.value`, kind)
                : await entity(val, kind, `${key}.${i}.options.${j}.value`),
            };
          }
          return row;
        });
        return table;
      });
    else value = await map(record(input).list, (x, i) => log(x, `${key}.${i}`));
    entries.push({ key, value });
  }
  return entries;
}

export async function validateBrowserBackup(input: unknown) {
  bounded(input);
  if (!validateGame(input))
    throw new Error(`Invalid game backup: ${validationErrors(validateGame.errors)}`);
  const backup = input;
  if (new Set(backup.gameData.map((x) => x.key)).size !== backup.gameData.length)
    throw new Error('Duplicate game data category.');
  if (backup.characters) await validateBundle(backup.characters);
  const assets = await readAssets(backup.assets);
  let bytes =
    backup.assets.reduce((sum, x) => sum + x.byteLength, 0) +
    (backup.characters?.assets.reduce((sum, x) => sum + x.byteLength, 0) ?? 0);
  if (bytes > 8 * 1024 * 1024) throw new Error('Combined image attachments exceed 8 MiB.');
  function inspect(value: unknown) {
    if (Array.isArray(value)) value.forEach(inspect);
    else if (value && typeof value === 'object') {
      const raw = record(value);
      if (typeof raw.url === 'string') webURL(raw.url);
      if (typeof raw.icon_url === 'string') webURL(raw.icon_url);
      if (raw.kind === 'bundle-asset' && !assets.has(raw.assetId as string))
        throw new Error('Missing game image attachment.');
      Object.values(raw).forEach(inspect);
    }
  }
  for (const entry of backup.gameData) {
    inspect(entry.value);
    if (Array.isArray(entry.value)) {
      const ids = entry.value.map((x) => record(x).id);
      if (new Set(ids).size !== ids.length) throw new Error('Duplicate game entity IDs.');
    }
    if (entry.key === 'bw-gm-friends') {
      const roster = record(entry.value);
      const slots = roster.slots as { id: string; index: number }[];
      if (
        new Set(slots.map((x) => x.id)).size !== slots.length ||
        new Set(slots.map((x) => x.index)).size !== slots.length ||
        slots.some((x) => x.index >= (roster.die as number))
      )
        throw new Error('Invalid or duplicate friend slot.');
    }
  }
  return assets;
}
export function hydrateGameEntry(entry: GameEntry, assets: Map<string, Blob>) {
  const value = hydrateTree(entry.value, assets);
  if (entry.key === 'bw-gm-tables') {
    for (const table of value as { options: { type: string; value: unknown }[] }[]) {
      for (const option of table.options)
        if (option.type === 'entity') option.value = record(option.value).data;
    }
  }
  if (entry.key === 'bw-rolllog2' || entry.key === 'bw-player-log') {
    const list = value as { id: string }[];
    return { ids: new Set(list.map((x) => x.id)), list };
  }
  return value;
}
