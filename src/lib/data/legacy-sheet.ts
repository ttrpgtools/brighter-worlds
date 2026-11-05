import type { Character } from '$lib/types';

export const validSheetId = (id: unknown): id is string =>
  typeof id === 'string' && /^[A-Za-z0-9_-]{1,128}$/.test(id);

export function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('Expected an object.');
  }
  return value as Record<string, unknown>;
}

const dice = [0, 4, 6, 8, 10, 12];
function attribute(value: unknown, die = false) {
  const attr = record(value);
  for (const key of ['current', 'max']) {
    const n = attr[key];
    if (
      !Number.isSafeInteger(n) ||
      (n as number) < 0 ||
      (die && (!dice.includes(n as number) || (key === 'max' && n === 0)))
    ) {
      throw new Error(`Invalid ${key} attribute.`);
    }
  }
}

function optional(
  value: Record<string, unknown>,
  keys: string[],
  kind: 'string' | 'boolean' | 'number',
) {
  for (const key of keys) {
    if (value[key] === undefined) continue;
    if (
      typeof value[key] !== kind ||
      (kind === 'number' && (!Number.isSafeInteger(value[key]) || (value[key] as number) < 0))
    ) {
      throw new Error(`Invalid ${key}.`);
    }
  }
}

function entity(input: unknown, path: string, kind?: string): Record<string, unknown> {
  const value = { ...record(input) };
  if (typeof value.name !== 'string') throw new Error(`Missing name at ${path}.`);
  if (value.id === undefined || value.id === '') value.id = path.replace(/[^A-Za-z0-9_-]/g, '-');
  if (typeof value.id !== 'string') throw new Error(`Invalid ID at ${path}.`);
  optional(value, ['desc', 'icon', 'details', 'quantFormula'], 'string');
  optional(value, ['blast', 'bulky', 'depleted', 'unequiped', 'fragile'], 'boolean');
  optional(value, ['armor', 'quantity'], 'number');
  if (
    value.image !== undefined &&
    typeof value.image !== 'string' &&
    !(typeof Blob !== 'undefined' && value.image instanceof Blob)
  ) {
    throw new Error(`Image bytes are missing or invalid at ${path}.`);
  }
  for (const key of ['damage', 'extra']) {
    if (value[key] !== undefined) {
      const values = Array.isArray(value[key]) ? (value[key] as unknown[]) : [value[key]];
      if (!values.length || !values.every((x) => dice.slice(1).includes(x as number))) {
        throw new Error(`Invalid ${key} at ${path}.`);
      }
    }
  }
  if (
    kind === 'ability' &&
    !['core', 'advanced', 'companion', 'enhance'].includes(value.type as string)
  ) {
    throw new Error(`Invalid ability at ${path}.`);
  }
  if ((kind === 'spell' || kind === 'ritual') && value.type !== kind) {
    throw new Error(`Invalid magic type at ${path}.`);
  }
  if (value.enableMagic !== undefined && typeof value.enableMagic !== 'boolean') {
    const magic = record(value.enableMagic);
    if (!['spell', 'spells', 'ritual', 'rituals', 'all'].includes(magic.type as string)) {
      throw new Error(`Invalid legacy magic at ${path}.`);
    }
    optional(magic, ['count'], 'number');
  }
  if (value.magic !== undefined) {
    const magic = { ...record(value.magic) };
    if (magic.charges !== undefined) attribute(magic.charges);
    for (const key of ['spell', 'ritual']) {
      if (magic[key] === undefined) continue;
      magic[key] = Array.isArray(magic[key])
        ? (magic[key] as unknown[]).map((x, i) => entity(x, `${path}-${key}-${i}`, key))
        : entity(magic[key], `${path}-${key}`, key);
    }
    value.magic = magic;
  }
  return value;
}

/** Normalize a *local* runtime record, retaining unknown fields and private settings locally. */
export function normalizeLegacySheet(input: unknown, expectedId?: string, order = 0): Character {
  const raw = record(input);
  if ('format' in raw || 'version' in raw)
    throw new Error('Versioned data requires the portable importer.');
  const id = raw.id === undefined || raw.id === '' ? expectedId : raw.id;
  if (!validSheetId(id) || (expectedId !== undefined && id !== expectedId)) {
    throw new Error('Sheet ID is invalid or disagrees with its storage key.');
  }
  if (typeof raw.name !== 'string') throw new Error('The sheet has no name field.');
  for (const key of ['str', 'dex', 'wil']) attribute(raw[key], true);
  attribute(raw.grit);
  optional(raw, ['pronouns', 'notes'], 'string');
  optional(raw, ['created', 'sortkey'], 'number');
  const statuses = raw.statuses ?? [];
  if (!(statuses instanceof Set) && !Array.isArray(statuses)) throw new Error('Invalid statuses.');
  if (![...statuses].every((x) => typeof x === 'string')) throw new Error('Invalid status name.');
  const result: Record<string, unknown> = {
    ...raw,
    id,
    pronouns: raw.pronouns ?? '',
    notes: raw.notes ?? '',
    statuses: new Set(statuses as Iterable<string>),
    created: raw.created ?? order,
    sortkey: raw.sortkey ?? order,
    calling: entity(raw.calling, 'calling'),
  };
  for (const [key, kind] of [
    ['equipment', 'item'],
    ['abilities', 'ability'],
    ['spells', 'spell'],
    ['rituals', 'ritual'],
  ] as const) {
    const list = raw[key] ?? [];
    if (!Array.isArray(list)) throw new Error(`Invalid ${key} list.`);
    result[key] = list.map((x, i) => entity(x, `${key}-${i}`, kind));
    const ids = (result[key] as Record<string, unknown>[]).map((x) => x.id);
    if (new Set(ids).size !== ids.length) throw new Error(`Duplicate IDs in ${key}.`);
  }
  const eulogy = raw.eulogy ?? [];
  if (!Array.isArray(eulogy)) throw new Error('Invalid epitaph entries.');
  result.eulogy = eulogy.map((x, i) => {
    const entry = { ...record(x) };
    entry.id ??= `eulogy-${i}`;
    if (
      typeof entry.id !== 'string' ||
      typeof entry.message !== 'string' ||
      typeof entry.xp !== 'boolean' ||
      typeof entry.spent !== 'boolean'
    )
      throw new Error('Invalid epitaph entry.');
    return entry;
  });
  if (raw.settings !== undefined) {
    const settings = record(raw.settings);
    optional(settings, ['rollToBridge', 'rollToDiscord'], 'boolean');
    optional(settings, ['discordWebhook'], 'string');
  }
  return result as unknown as Character;
}

/** Stable comparison for local structured records (not a portable payload serializer). */
export function localFingerprint(value: unknown): string {
  const seen = new Set<object>();
  function visit(x: unknown): unknown {
    if (x === null || typeof x !== 'object') return x;
    if (seen.has(x)) throw new Error('Cyclic saved data requires recovery.');
    seen.add(x);
    let result: unknown;
    if (x instanceof Date) result = { $date: x.getTime() };
    else if (x instanceof Set) result = { $set: [...x].map(visit) };
    else if (typeof Blob !== 'undefined' && x instanceof Blob) {
      // Never conclude that a legacy JSON image equals persisted Blob bytes.
      throw new Error('Binary data requires a byte comparison.');
    } else if (Array.isArray(x)) result = x.map(visit);
    else
      result = Object.fromEntries(
        Object.keys(x)
          .sort()
          .map((key) => [key, visit((x as Record<string, unknown>)[key])]),
      );
    seen.delete(x);
    return result;
  }
  return JSON.stringify(visit(value));
}
