import { error, type RequestEvent } from '@sveltejs/kit';
import { requireAccount } from './ankh';
import type { SheetDocumentV1 } from '$lib/data/sheet-format/types';
export { CHARACTER_COLLECTION } from '$lib/data/sheet-format/types';
export type AegisCtx = { userId: string };
export type AegisCursor = { updatedAt: number; docId: string };
export type SheetMeta = {
  formatVersion: 1;
  name: string;
  calling: string;
  createdAt: number | null;
};
export type AegisDoc = {
  docId: string;
  data: SheetDocumentV1;
  meta: SheetMeta | null;
  version: number;
  createdAt: number;
  updatedAt: number;
};
export type AegisListPage = { items: Omit<AegisDoc, 'data'>[]; nextCursor: AegisCursor | null };
export type WriteFailure =
  | { ok: false; reason: 'exists' | 'not_found' | 'quota_exceeded' }
  | { ok: false; reason: 'conflict'; currentVersion: number };
export interface AegisService {
  list(
    ctx: AegisCtx,
    collection: string,
    options: { limit: number; cursor: AegisCursor | null },
  ): Promise<AegisListPage>;
  get(
    ctx: AegisCtx,
    collection: string,
    docId: string,
  ): Promise<{ found: false } | { found: true; doc: AegisDoc }>;
  create(
    ctx: AegisCtx,
    collection: string,
    docId: string,
    data: SheetDocumentV1,
    meta: SheetMeta,
  ): Promise<{ ok: true; version: number; createdAt: number; updatedAt: number } | WriteFailure>;
  update(
    ctx: AegisCtx,
    collection: string,
    docId: string,
    data: SheetDocumentV1,
    version: number,
    meta: SheetMeta,
  ): Promise<{ ok: true; version: number; updatedAt: number } | WriteFailure>;
  delete(
    ctx: AegisCtx,
    collection: string,
    docId: string,
    version: number,
  ): Promise<{ ok: true } | WriteFailure>;
}
export function requireAegis(event: RequestEvent) {
  const user = requireAccount(event);
  const expectedOwner = event.request.headers.get('X-Brighter-Worlds-Owner');
  if (expectedOwner && expectedOwner !== user.id) {
    error(409, {
      code: 'account_changed',
      message: 'The signed-in account changed. This draft was not sent to another account.',
    });
  }
  const service = event.platform?.env.STORE;
  if (!service)
    error(503, { code: 'storage_unavailable', message: 'Account storage is not configured.' });
  return { service, ctx: { userId: user.id } };
}
export function sheetMeta(sheet: SheetDocumentV1): SheetMeta {
  return {
    formatVersion: 1,
    name: sheet.character.name,
    calling: sheet.character.calling.name,
    createdAt: sheet.createdAt,
  };
}
export async function storageCall<T>(call: () => Promise<T>) {
  try {
    return await call();
  } catch {
    error(503, {
      code: 'storage_unavailable',
      message: 'Account storage is temporarily unavailable. Please try again.',
    });
  }
}
