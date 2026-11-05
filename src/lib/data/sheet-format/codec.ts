import sanitizeHtml from 'sanitize-html';
import { sanitizeDescription } from '$lib/util/sanitize-html';
export { sanitizeDescription } from '$lib/util/sanitize-html';
import { normalizeLegacySheet, record, validSheetId } from '../legacy-sheet';
import type { Ability, Character } from '$lib/types';
import type {
  BundleAssetV1,
  CompanionRelation,
  PortableImage,
  SheetBundleV1,
  SheetDocumentV1,
} from './types';

export const MAX_BACKUP_BYTES = 16 * 1024 * 1024;
export const utf8Size = (text: string) => new TextEncoder().encode(text).byteLength;
export {
  validateSheet as sheetValidator,
  validateBundle as bundleValidator,
} from './compiled-validators.js';
import {
  validateSheet as sheetValidator,
  validateBundle as bundleValidator,
  type ValidationError,
} from './compiled-validators.js';
export const validationErrors = (errors: ValidationError[] | null | undefined) =>
  (errors ?? []).map((x) => `${x.instancePath ?? ''} ${x.message ?? 'Invalid value'}`).join('; ');
export function webURL(value: string) {
  const url = new URL(value);
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password)
    throw new Error('Images and links require HTTP(S) URLs without credentials.');
  return url.href;
}

export function bounded(value: unknown, max = MAX_BACKUP_BYTES) {
  const visit = (x: unknown, depth: number) => {
    if (depth > 20) throw new Error('Saved data is nested too deeply.');
    if (x && typeof x === 'object') {
      if (x instanceof Blob || x instanceof Set) throw new Error('Expected portable JSON data.');
      for (const val of Object.values(x)) visit(val, depth + 1);
    } else if (typeof x === 'number' && !Number.isFinite(x))
      throw new Error('Invalid numeric data.');
  };
  visit(value, 0);
  if (utf8Size(JSON.stringify(value)) > max)
    throw new Error('This backup exceeds the supported size limit.');
}
export function assertSheet(value: unknown): asserts value is SheetDocumentV1 {
  bounded(value, 512 * 1024);
  if (!sheetValidator(value))
    throw new Error(`Invalid sheet: ${validationErrors(sheetValidator.errors)}`);
  const sheet = value;
  imageRefs(sheet);
  for (const list of [
    sheet.character.equipment,
    sheet.character.abilities,
    sheet.character.spells,
    sheet.character.rituals,
    sheet.character.eulogy,
  ]) {
    if (new Set(list.map((x) => x.id)).size !== list.length)
      throw new Error('Duplicate entity IDs in a sheet.');
  }
  const seen = new Set<string>();
  for (const relation of sheet.relations) {
    if (
      relation.sheetId === sheet.id ||
      seen.has(relation.abilityId) ||
      !sheet.character.abilities.some((x) => x.id === relation.abilityId && x.type === 'companion')
    ) {
      throw new Error('Invalid or ambiguous companion relation.');
    }
    seen.add(relation.abilityId);
  }
}
export const canonical = (value: unknown): string => {
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  if (value && typeof value === 'object')
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${canonical((value as Record<string, unknown>)[key])}`)
      .join(',')}}`;
  return JSON.stringify(value);
};
export async function hash(bytes: Uint8Array) {
  const digest = await crypto.subtle.digest('SHA-256', new Uint8Array(bytes).buffer);
  return [...new Uint8Array(digest)].map((n) => n.toString(16).padStart(2, '0')).join('');
}
export const contentHash = (value: unknown) => hash(new TextEncoder().encode(canonical(value)));

function imageType(bytes: Uint8Array): BundleAssetV1['mediaType'] {
  const text = (a: number, b: number) => String.fromCharCode(...bytes.slice(a, b));
  if (
    bytes.length >= 33 &&
    [...bytes.slice(0, 8)].join(',') === '137,80,78,71,13,10,26,10' &&
    text(12, 16) === 'IHDR'
  )
    return 'image/png';
  if (
    bytes.length > 4 &&
    bytes[0] === 255 &&
    bytes[1] === 216 &&
    bytes.at(-2) === 255 &&
    bytes.at(-1) === 217
  )
    return 'image/jpeg';
  if (bytes.length > 12 && text(0, 4) === 'RIFF' && text(8, 12) === 'WEBP') return 'image/webp';
  if (bytes.length > 13 && ['GIF87a', 'GIF89a'].includes(text(0, 6)) && bytes.at(-1) === 59)
    return 'image/gif';
  throw new Error('An image is not a supported PNG, JPEG, WebP or GIF raster.');
}
function base64(bytes: Uint8Array) {
  let text = '';
  for (let i = 0; i < bytes.length; i += 8192)
    text += String.fromCharCode(...bytes.subarray(i, i + 8192));
  return btoa(text);
}
export async function readAssets(assets: BundleAssetV1[]) {
  const result = new Map<string, Blob>();
  let total = 0;
  for (const asset of assets) {
    if (result.has(asset.id)) throw new Error('Duplicate attachment ID.');
    const bytes = Uint8Array.from(atob(asset.data), (ch) => ch.charCodeAt(0));
    total += bytes.byteLength;
    if (
      total > 8 * 1024 * 1024 ||
      bytes.length > 2 * 1024 * 1024 ||
      bytes.length !== asset.byteLength ||
      base64(bytes) !== asset.data ||
      (await hash(bytes)) !== asset.sha256 ||
      imageType(bytes) !== asset.mediaType
    ) {
      throw new Error('An image attachment failed its type, size or checksum check.');
    }
    result.set(asset.id, new Blob([bytes.buffer], { type: asset.mediaType }));
  }
  return result;
}

export class ExportContext {
  assets = new Map<string, BundleAssetV1>();
  warnings: string[] = [];
  constructor(public origin: string | null) {}
  project(input: unknown, keys: string[], path: string, ignored: string[] = []) {
    const raw = record(input);
    for (const key of Object.keys(raw)) {
      if (!keys.includes(key) && !ignored.includes(key))
        this.warnings.push(`${path}.${key} was left in the original record.`);
    }
    return Object.fromEntries(
      keys.filter((key) => raw[key] !== undefined).map((key) => [key, raw[key]]),
    );
  }
  async image(value: unknown): Promise<PortableImage> {
    if (typeof value === 'string') return { kind: 'url', url: webURL(value) };
    if (!(value instanceof Blob)) throw new Error('An image has no recoverable bytes.');
    if (value.size > 2 * 1024 * 1024) throw new Error('An image exceeds 2 MiB.');
    const bytes = new Uint8Array(await value.arrayBuffer());
    const mediaType = imageType(bytes);
    if (value.type && value.type !== mediaType)
      throw new Error('Image MIME type disagrees with its bytes.');
    const sha256 = await hash(bytes);
    const id = `asset_${sha256}`;
    this.assets.set(id, {
      id,
      mediaType,
      encoding: 'base64',
      data: base64(bytes),
      byteLength: bytes.length,
      sha256,
    });
    return { kind: 'bundle-asset', assetId: id };
  }
  async entity(input: unknown, path: string, kind = 'entity'): Promise<Record<string, unknown>> {
    const common = ['id', 'name', 'desc', 'image', 'icon'];
    const usable = ['damage', 'blast'];
    const item = [
      'unequiped',
      'bulky',
      'depleted',
      'armor',
      'fragile',
      'quantity',
      'quantFormula',
      'magic',
    ];
    const keys = [
      ...common,
      ...(kind === 'entity' ? [] : usable),
      ...(kind === 'item' ? item : []),
      ...(kind === 'ability' ? ['type', 'details'] : []),
      ...(['spell', 'ritual'].includes(kind) ? ['type'] : []),
    ];
    const raw = record(input);
    const result = this.project(raw, keys, path, [
      'extra',
      'enableMagic',
      'companionSheetId',
      'unresolvedCompanionId',
    ]);
    if (raw.image !== undefined && raw.image !== '') result.image = await this.image(raw.image);
    else delete result.image;
    const legacyRules: Record<string, unknown> = {};
    if (raw.extra !== undefined) legacyRules.extra = raw.extra;
    if (kind === 'item' && raw.enableMagic !== undefined) legacyRules.enableMagic = raw.enableMagic;
    if (Object.keys(legacyRules).length) result.legacyRules = legacyRules;
    if (raw.magic !== undefined) {
      const magic = this.project(raw.magic, ['charges', 'spell', 'ritual'], `${path}.magic`);
      if (magic.charges !== undefined)
        magic.charges = this.project(magic.charges, ['current', 'max'], `${path}.magic.charges`);
      for (const key of ['spell', 'ritual']) {
        if (magic[key] !== undefined)
          magic[key] = Array.isArray(magic[key])
            ? await Promise.all(
                (magic[key] as unknown[]).map((x, i) =>
                  this.entity(x, `${path}.magic.${key}.${i}`, key),
                ),
              )
            : await this.entity(magic[key], `${path}.magic.${key}`, key);
      }
      result.magic = magic;
    }
    return result;
  }
}

function companionLink(
  desc: string,
  origin: string | null,
): { id: string; label: string } | undefined {
  if (!/^\s*<a\b[^>]*>[^<>]*<\/a>\s*$/i.test(desc)) return;
  let href = '';
  let attributesOK = true;
  sanitizeHtml(desc, {
    transformTags: {
      a: (tagName, attribs) => {
        href = attribs.href;
        attributesOK = Object.keys(attribs).every((key) =>
          ['href', 'class', 'target', 'rel'].includes(key),
        );
        return { tagName, attribs };
      },
    },
  });
  if (!href || !attributesOK) return;
  try {
    if (origin === null && !href.startsWith('/character/')) return;
    const url = new URL(href, origin ?? 'https://legacy.invalid');
    if (url.origin !== (origin ?? 'https://legacy.invalid') || url.search || url.hash) return;
    const match = /^\/character\/([A-Za-z0-9_-]{1,128})\/?$/.exec(url.pathname);
    if (match)
      return {
        id: match[1],
        label: sanitizeHtml(desc, { allowedTags: [], allowedAttributes: {} }),
      };
  } catch {
    /* Ambiguous markup stays in the original record. */
  }
}

export async function encodeSheet(input: unknown, context: ExportContext, expectedId?: string) {
  const sheet = normalizeLegacySheet(input, expectedId);
  const raw = record(sheet);
  context.project(
    raw,
    [
      'id',
      'name',
      'pronouns',
      'grit',
      'str',
      'dex',
      'wil',
      'statuses',
      'equipment',
      'calling',
      'abilities',
      'eulogy',
      'spells',
      'rituals',
      'notes',
    ],
    'sheet',
    ['created', 'sortkey', 'settings'],
  );
  const character: Record<string, unknown> = {};
  for (const key of ['name', 'pronouns', 'notes']) character[key] = raw[key];
  for (const key of ['grit', 'str', 'dex', 'wil'])
    character[key] = context.project(raw[key], ['current', 'max'], key);
  character.statuses = [...sheet.statuses];
  character.calling = await context.entity(sheet.calling, 'calling');
  for (const [key, kind] of [
    ['equipment', 'item'],
    ['abilities', 'ability'],
    ['spells', 'spell'],
    ['rituals', 'ritual'],
  ] as const) {
    character[key] = await Promise.all(
      (raw[key] as unknown[]).map((x, i) => context.entity(x, `${key}.${i}`, kind)),
    );
  }
  character.eulogy = sheet.eulogy.map((x, i) =>
    context.project(x, ['id', 'message', 'xp', 'spent'], `eulogy.${i}`),
  );
  const relations: CompanionRelation[] = [];
  const unresolved = new Set<string>();
  for (let i = 0; i < sheet.abilities.length; i++) {
    const ability = sheet.abilities[i];
    if (ability.type !== 'companion') continue;
    const parsed = ability.desc ? companionLink(ability.desc, context.origin) : undefined;
    const id = ability.companionSheetId ?? ability.unresolvedCompanionId ?? parsed?.id;
    if (id) {
      if (!validSheetId(id)) throw new Error('Invalid companion ID.');
      relations.push({ kind: 'companion', abilityId: ability.id, sheetId: id });
      if (ability.unresolvedCompanionId) unresolved.add(id);
      if (parsed && !ability.companionSheetId && !ability.unresolvedCompanionId) {
        (character.abilities as Record<string, unknown>[])[i].desc = parsed.label;
      }
    } else if (ability.desc?.includes('<a'))
      context.warnings.push(
        `Companion ${ability.name} has an ambiguous link; the original record was kept.`,
      );
  }
  const document: unknown = {
    format: 'brighter-worlds.sheet',
    version: 1,
    id: sheet.id,
    createdAt: sheet.created >= Date.UTC(2000, 0, 1) ? sheet.created : null,
    character,
    relations,
  };
  assertSheet(document);
  return { document, unresolved };
}

export async function buildBundle(
  records: Map<string, unknown>,
  roots: string[],
  origin: string | null,
) {
  const context = new ExportContext(origin);
  const sheets: SheetDocumentV1[] = [];
  const unresolvedRelations: SheetBundleV1['unresolvedRelations'] = [];
  const visited = new Set<string>();
  async function visit(id: string) {
    if (visited.has(id)) return;
    visited.add(id);
    const raw = records.get(id);
    if (!raw)
      throw new Error(`The selected sheet ${id} is unavailable. Use original-record recovery.`);
    const { document, unresolved } = await encodeSheet(raw, context, id);
    sheets.push(document);
    for (const relation of document.relations) {
      if (!records.has(relation.sheetId) || unresolved.has(relation.sheetId)) {
        unresolvedRelations.push({
          sheetId: id,
          abilityId: relation.abilityId,
          targetSheetId: relation.sheetId,
        });
      } else await visit(relation.sheetId);
    }
  }
  for (const id of roots) await visit(id);
  const bundle: SheetBundleV1 = {
    format: 'brighter-worlds.bundle',
    version: 1,
    id: crypto.randomUUID(),
    exportedAt: Date.now(),
    source: { origin, storage: 'browser-local' },
    roots: [...new Set(roots)],
    sheets,
    assets: [...context.assets.values()],
    unresolvedRelations,
  };
  await validateBundle(bundle);
  return { bundle, warnings: [...new Set(context.warnings)] };
}

function imageRefs(value: unknown, refs: string[] = []): string[] {
  if (Array.isArray(value)) value.forEach((x) => imageRefs(x, refs));
  else if (value && typeof value === 'object') {
    const raw = record(value);
    if (raw.kind === 'url') webURL(raw.url as string);
    else if (raw.kind === 'bundle-asset') refs.push(raw.assetId as string);
    else Object.values(raw).forEach((x) => imageRefs(x, refs));
  }
  return refs;
}
export async function validateBundle(value: unknown): Promise<Map<string, Blob>> {
  bounded(value);
  if (!bundleValidator(value))
    throw new Error(`Invalid character bundle: ${validationErrors(bundleValidator.errors)}`);
  const bundle = value;
  if (
    bundle.source.origin !== null &&
    new URL(bundle.source.origin).origin !== bundle.source.origin
  )
    throw new Error('Invalid source origin.');
  const ids = new Set(bundle.sheets.map((x) => x.id));
  if (ids.size !== bundle.sheets.length || bundle.roots.some((id) => !ids.has(id)))
    throw new Error('Duplicate sheets or missing selected roots.');
  const relationKeys = new Set<string>();
  const missing = new Set<string>();
  const key = (x: SheetBundleV1['unresolvedRelations'][number]) =>
    `${x.sheetId}:${x.abilityId}:${x.targetSheetId}`;
  for (const sheet of bundle.sheets) {
    assertSheet(sheet);
    for (const relation of sheet.relations) {
      const relationKey = key({
        sheetId: sheet.id,
        abilityId: relation.abilityId,
        targetSheetId: relation.sheetId,
      });
      relationKeys.add(relationKey);
      if (!ids.has(relation.sheetId)) missing.add(relationKey);
    }
  }
  const declared = bundle.unresolvedRelations.map(key);
  if (
    new Set(declared).size !== declared.length ||
    declared.some((x) => !relationKeys.has(x)) ||
    [...missing].some((x) => !declared.includes(x))
  )
    throw new Error('Missing or inaccurate companion warning manifest.');
  const assets = await readAssets(bundle.assets);
  if (imageRefs(bundle.sheets).some((id) => !assets.has(id)))
    throw new Error('An image attachment is missing.');
  return assets;
}

export function hydrateTree(value: unknown, assets: Map<string, Blob>): unknown {
  if (Array.isArray(value)) return value.map((x) => hydrateTree(x, assets));
  if (!value || typeof value !== 'object') return value;
  const raw = record(value);
  if (raw.kind === 'url') return webURL(raw.url as string);
  if (raw.kind === 'bundle-asset') {
    const image = assets.get(raw.assetId as string);
    if (!image) throw new Error('Missing image attachment.');
    return image;
  }
  const result: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(raw)) {
    if (key === 'legacyRules') Object.assign(result, val);
    else
      result[key] =
        key === 'desc' && typeof val === 'string'
          ? sanitizeDescription(val)
          : hydrateTree(val, assets);
  }
  return result;
}
export function hydrateSheet(
  document: SheetDocumentV1,
  assets: Map<string, Blob>,
  idMap: Map<string, string>,
  included: Set<string>,
  unresolved: SheetBundleV1['unresolvedRelations'] = [],
): Character {
  const char = hydrateTree(document.character, assets) as Character;
  char.id = idMap.get(document.id) ?? document.id;
  char.created = document.createdAt ?? 0;
  char.sortkey = Date.now();
  char.statuses = new Set(document.character.statuses);
  for (const relation of document.relations) {
    const ability = char.abilities.find((x) => x.id === relation.abilityId) as Ability;
    if (
      included.has(relation.sheetId) &&
      !unresolved.some(
        (x) =>
          x.sheetId === document.id &&
          x.abilityId === relation.abilityId &&
          x.targetSheetId === relation.sheetId,
      )
    )
      ability.companionSheetId = idMap.get(relation.sheetId) ?? relation.sheetId;
    else ability.unresolvedCompanionId = relation.sheetId;
  }
  return char;
}
