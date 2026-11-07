import { createHash } from 'node:crypto';
import Ajv2020 from 'ajv/dist/2020.js';
import { describe, expect, it } from 'vitest';
import sheetSchema from './sheet-v1.schema.json';
import bundleSchema from './bundle-v1.schema.json';
import rootLegacy from './fixtures/legacy-root.json';
import devLegacy from './fixtures/legacy-dev.json';
import sheetFixture from './fixtures/sheet-v1.json';
import devSheetFixture from './fixtures/sheet-dev-v1.json';
import bundleFixture from './fixtures/bundle-v1.json';
import {
  ACCOUNT_APP_ID,
  CHARACTER_COLLECTION,
  type SheetBundleV1,
  type SheetDocumentV1,
} from './types';

const ajv = new Ajv2020({ strict: true, allErrors: true });
// The schemas use only absolute HTTP(S) URI fields. Semantic URL policy is
// documented separately; schema validation never fetches a remote resource.
ajv.addFormat('uri', (value: string) => {
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
});
const validateSheet = ajv.compile<SheetDocumentV1>(sheetSchema);
const validateBundle = ajv.compile<SheetBundleV1>(bundleSchema);

describe('versioned sheet contract', () => {
  it('validates the full sheet fixture without coercion or mutation', () => {
    const original = structuredClone(sheetFixture);
    expect(validateSheet(sheetFixture), JSON.stringify(validateSheet.errors)).toBe(true);
    expect(sheetFixture).toEqual(original);
    expect(ACCOUNT_APP_ID).toBe('bwo');
    expect(CHARACTER_COLLECTION).toBe('pc');
  });

  it.each([
    ['sheet', sheetFixture, validateSheet],
    ['dev sheet', devSheetFixture, validateSheet],
    ['bundle', bundleFixture, validateBundle],
  ] as const)(
    'round-trips the %s fixture through JSON without changing data',
    (_, fixture, check) => {
      const json = JSON.stringify(fixture);
      const restored: unknown = JSON.parse(json);
      expect(check(restored), JSON.stringify(check.errors)).toBe(true);
      expect(restored).toEqual(fixture);
      expect(JSON.stringify(restored)).toBe(json);
    },
  );

  it('pins the expected legacy-root conversion without introducing an upgrader', () => {
    const { character, relations } = sheetFixture;
    expect(sheetFixture.id).toBe(rootLegacy.id);
    expect(sheetFixture.createdAt).toBeNull();
    for (const key of [
      'name',
      'pronouns',
      'grit',
      'str',
      'dex',
      'wil',
      'statuses',
      'calling',
      'eulogy',
      'spells',
      'rituals',
      'notes',
    ] as const) {
      expect(character[key], key).toEqual(rootLegacy[key]);
    }
    expect(character.equipment[0].legacyRules).toEqual({ extra: rootLegacy.equipment[0].extra });
    expect(character.equipment[1].legacyRules).toEqual({
      enableMagic: rootLegacy.equipment[1].enableMagic,
    });
    expect(relations).toEqual([
      { kind: 'companion', abilityId: rootLegacy.abilities[0].id, sheetId: 'pip_01' },
    ]);
    expect(character.abilities[0].id).toBe(rootLegacy.abilities[0].id);
    expect(character.abilities[0].desc).toBe("Pip's Sheet");
    expect(rootLegacy.abilities[0].desc).toContain('/character/pip_01');
    const portableJson = JSON.stringify(sheetFixture);
    expect(portableJson).not.toContain(rootLegacy.settings.discordWebhook);
    expect(portableJson).not.toContain('unknownLegacyField');
    expect(portableJson).not.toContain('rollToBridge');
  });

  it('keeps dev-era edge cases in the compatibility fixture', () => {
    expect(validateSheet(devSheetFixture), JSON.stringify(validateSheet.errors)).toBe(true);
    expect(devSheetFixture.createdAt).toBe(devLegacy.created);
    expect(devSheetFixture.character.grit).toEqual(devLegacy.grit);
    expect(devSheetFixture.character.statuses).toEqual(devLegacy.statuses);
    expect(devLegacy.created).toBeGreaterThanOrEqual(Date.UTC(2000, 0, 1));
    expect(devLegacy.sortkey).toBe(42);
    expect(devLegacy.grit.current).toBeGreaterThan(devLegacy.grit.max);
    expect(devLegacy.str.current).toBe(0);
    const wand = devLegacy.equipment.find((item) => item.id === 'wand_01');
    expect(wand?.magic?.charges).toEqual({ current: 0, max: 3 });
    expect(wand?.magic?.spell.damage).toEqual([4, 6]);
    const portableWand = devSheetFixture.character.equipment.find((item) => item.id === 'wand_01');
    expect(portableWand?.magic?.charges).toEqual(wand?.magic?.charges);
    expect(portableWand?.magic?.spell.image).toEqual({
      kind: 'url',
      url: wand?.magic?.spell.image,
    });
    expect(devSheetFixture).not.toHaveProperty('sortkey');
  });

  const rejectedSheets: [string, () => unknown][] = [
    ['future version', () => ({ ...sheetFixture, version: 2 })],
    ['wrong discriminator', () => ({ ...sheetFixture, format: 'another-game.sheet' })],
    ['unversioned legacy input', () => rootLegacy],
    ['owner in portable payload', () => ({ ...sheetFixture, ownerId: 'account-A' })],
    [
      'private settings',
      () => ({
        ...sheetFixture,
        character: { ...sheetFixture.character, settings: rootLegacy.settings },
      }),
    ],
    [
      'nested unknown fields',
      () => ({
        ...sheetFixture,
        character: {
          ...sheetFixture.character,
          calling: { ...sheetFixture.character.calling, token: 'must-stay-local' },
        },
      }),
    ],
    [
      'invalid attribute die',
      () => ({
        ...sheetFixture,
        character: { ...sheetFixture.character, str: { current: 5, max: 6 } },
      }),
    ],
    [
      'missing required character field',
      () => ({
        ...sheetFixture,
        character: { ...sheetFixture.character, notes: undefined },
      }),
    ],
    [
      'duplicate statuses',
      () => ({
        ...sheetFixture,
        character: { ...sheetFixture.character, statuses: ['Wounded', 'Wounded'] },
      }),
    ],
    ['unsafe sheet ID', () => ({ ...sheetFixture, id: '../other-sheet' })],
    [
      'wrong nested magic kind',
      () => ({
        ...sheetFixture,
        character: {
          ...sheetFixture.character,
          spells: [{ id: 'magic_01', name: 'Ritual in a spell list', type: 'ritual' }],
        },
      }),
    ],
    [
      'empty damage pool',
      () => ({
        ...sheetFixture,
        character: {
          ...sheetFixture.character,
          equipment: [{ id: 'blade', name: 'Blade', damage: [] }],
        },
      }),
    ],
    [
      'unconverted Blob-shaped image',
      () => ({
        ...sheetFixture,
        character: { ...sheetFixture.character, calling: { id: 'calling', name: '', image: {} } },
      }),
    ],
    [
      'ephemeral blob URL',
      () => ({
        ...sheetFixture,
        character: {
          ...sheetFixture.character,
          calling: {
            id: 'calling',
            name: '',
            image: { kind: 'url', url: 'blob:https://example.com/a' },
          },
        },
      }),
    ],
    [
      'URL with embedded credentials',
      () => ({
        ...sheetFixture,
        character: {
          ...sheetFixture.character,
          calling: {
            id: 'calling',
            name: '',
            image: { kind: 'url', url: 'https://user:secret@example.invalid/image.png' },
          },
        },
      }),
    ],
  ];
  it.each(rejectedSheets)('rejects %s without silently editing input', (_, make) => {
    const input = make();
    const original = structuredClone(input);
    expect(validateSheet(input)).toBe(false);
    expect(input).toEqual(original);
  });

  it('preserves valid zero, false, ordering and over-max values', () => {
    const input = structuredClone(sheetFixture);
    input.character.grit.current = 5;
    expect(validateSheet(input), JSON.stringify(validateSheet.errors)).toBe(true);
    expect(input.character.str.current).toBe(0);
    expect(input.character.eulogy[0].spent).toBe(false);
    expect(input.character.equipment.map((item) => item.id)).toEqual(['blade_01', 'book_01']);
  });
});

describe('bundle fixture integrity beyond JSON Schema', () => {
  it('contains unique sheets and a complete companion graph rooted in the selection', () => {
    expect(validateBundle(bundleFixture), JSON.stringify(validateBundle.errors)).toBe(true);
    const sheets = bundleFixture.sheets;
    const ids = new Set(sheets.map((sheet) => sheet.id));
    expect(ids.size).toBe(sheets.length);
    expect(bundleFixture.roots.every((id) => ids.has(id))).toBe(true);
    expect(bundleFixture.unresolvedRelations).toEqual([]);
    for (const sheet of sheets) {
      for (const relation of sheet.relations) {
        expect(ids.has(relation.sheetId)).toBe(true);
        expect(relation.sheetId).not.toBe(sheet.id);
        expect(
          sheet.character.abilities.some(
            (ability) => ability.id === relation.abilityId && ability.type === 'companion',
          ),
        ).toBe(true);
      }
    }
  });

  it('has byte-exact PNG attachments with matching size, hash and references', () => {
    const assets = bundleFixture.assets;
    expect(new Set(assets.map((asset) => asset.id)).size).toBe(assets.length);
    for (const asset of assets) {
      const bytes = Buffer.from(asset.data, 'base64');
      expect(bytes.toString('base64')).toBe(asset.data);
      expect(bytes.byteLength).toBe(asset.byteLength);
      expect(createHash('sha256').update(bytes).digest('hex')).toBe(asset.sha256);
      expect(asset.mediaType).toBe('image/png');
      expect(bytes.subarray(0, 8).toString('hex')).toBe('89504e470d0a1a0a');
    }
    const companion = bundleFixture.sheets.find((sheet) => sheet.id === 'pip_01');
    expect(companion?.character.calling.image).toEqual({
      kind: 'bundle-asset',
      assetId: assets[0].id,
    });
  });

  it.each([
    ['future bundle', { ...bundleFixture, version: 2 }],
    ['missing selected roots', { ...bundleFixture, roots: [] }],
    [
      'private provenance',
      {
        ...bundleFixture,
        source: { ...bundleFixture.source, ownerId: 'account-A' },
      },
    ],
    [
      'origin containing a path',
      {
        ...bundleFixture,
        source: {
          ...bundleFixture.source,
          origin: 'https://dev.brighterworlds.app/character/hero_01',
        },
      },
    ],
    [
      'malformed attachment',
      {
        ...bundleFixture,
        assets: [{ ...bundleFixture.assets[0], data: 'not base64!' }],
      },
    ],
    [
      'active image type',
      {
        ...bundleFixture,
        assets: [{ ...bundleFixture.assets[0], mediaType: 'image/svg+xml' }],
      },
    ],
  ])('rejects %s', (_, input) => {
    expect(validateBundle(input)).toBe(false);
  });
});
