/** Portable contract only. Existing browser stores continue to use Character. */
export const SHEET_FORMAT = 'brighter-worlds.sheet' as const;
export const BUNDLE_FORMAT = 'brighter-worlds.bundle' as const;
export const FORMAT_VERSION = 1 as const;
export const ACCOUNT_APP_ID = 'bwo' as const;
export const CHARACTER_COLLECTION = 'pc' as const;

export type SheetDie = 4 | 6 | 8 | 10 | 12;
export type PortableImage =
  | { kind: 'url'; url: string }
  | { kind: 'bundle-asset'; assetId: string };

export interface PortableEntity {
  id: string;
  name: string;
  desc?: string;
  image?: PortableImage;
  icon?: string;
}

export interface PortableUsableEntity extends PortableEntity {
  damage?: SheetDie | SheetDie[];
  blast?: boolean;
  /** Preserved rules from older releases, not silently reinterpreted. */
  legacyRules?: { extra?: SheetDie };
}

export interface PortableMagic<
  T extends 'spell' | 'ritual' = 'spell' | 'ritual',
> extends PortableUsableEntity {
  type: T;
}

export interface PortableItem extends PortableUsableEntity {
  /** Historical spelling is part of the v1 contract. */
  unequiped?: boolean;
  bulky?: boolean;
  depleted?: boolean;
  armor?: number;
  fragile?: boolean;
  quantity?: number;
  quantFormula?: string;
  magic?: {
    charges?: { current: number; max: number };
    spell?: PortableMagic<'spell'> | PortableMagic<'spell'>[];
    ritual?: PortableMagic<'ritual'> | PortableMagic<'ritual'>[];
  };
  legacyRules?: {
    extra?: SheetDie;
    enableMagic?:
      | boolean
      | { type: 'spell' | 'ritual' | 'spells' | 'rituals' | 'all'; count?: number };
  };
}

export interface PortableAbility extends PortableUsableEntity {
  type: 'core' | 'advanced' | 'companion' | 'enhance';
  details?: string;
}

export interface CompanionRelation {
  kind: 'companion';
  abilityId: string;
  sheetId: string;
}

export interface SheetDocumentV1 {
  format: typeof SHEET_FORMAT;
  version: typeof FORMAT_VERSION;
  id: string;
  /** Unix milliseconds; null when the original creation time is unknown. */
  createdAt: number | null;
  character: {
    name: string;
    pronouns: string;
    grit: { current: number; max: number };
    str: { current: SheetDie | 0; max: SheetDie };
    dex: { current: SheetDie | 0; max: SheetDie };
    wil: { current: SheetDie | 0; max: SheetDie };
    statuses: string[];
    equipment: PortableItem[];
    calling: PortableEntity;
    abilities: PortableAbility[];
    eulogy: { id: string; message: string; xp: boolean; spent: boolean }[];
    spells: PortableMagic<'spell'>[];
    rituals: PortableMagic<'ritual'>[];
    notes: string;
  };
  relations: CompanionRelation[];
}

export interface BundleAssetV1 {
  id: string;
  mediaType: 'image/png' | 'image/jpeg' | 'image/webp' | 'image/gif';
  encoding: 'base64';
  data: string;
  byteLength: number;
  sha256: string;
}

export interface SheetBundleV1 {
  format: typeof BUNDLE_FORMAT;
  version: typeof FORMAT_VERSION;
  id: string;
  exportedAt: number;
  /** Provenance is descriptive and never grants storage/account access. */
  source: {
    origin: string | null;
    storage: 'browser-local' | 'account' | 'world' | 'file';
  };
  roots: string[];
  /** Ordered selection plus companion closure. */
  sheets: SheetDocumentV1[];
  assets: BundleAssetV1[];
  unresolvedRelations: { sheetId: string; abilityId: string; targetSheetId: string }[];
}

/** Never serialize this into a sheet or bundle. Versions here are not format versions. */
export type SheetStorageIdentity =
  | { source: 'local'; documentId: string }
  | { source: 'account'; ownerId: string; documentId: string }
  | { source: 'world'; worldId: string; providerId: string; documentId: string };

export interface SheetStorageMetadataV1 {
  version: 1;
  identity: SheetStorageIdentity;
  localSortKey?: number;
  provenance?: {
    origin: string | null;
    originalId: string;
    format: 'localstorage-v0' | 'indexeddb-v0' | 'sheet-v1';
    transferId?: string;
  };
  sync?: {
    version?: number;
    dirty: boolean;
    lastSyncedAt?: number;
    conflictVersion?: number;
    errorCode?: 'network' | 'auth' | 'quota' | 'missing' | 'conflict';
  };
}

/** Origin-local configuration; never part of a portable payload. */
export interface SheetPreferencesV1 {
  version: 1;
  identity: SheetStorageIdentity;
  discord?: { enabled: boolean; webhook: string };
}
