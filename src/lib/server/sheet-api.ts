import { error, json, type RequestEvent } from '@sveltejs/kit';
import { assertSheet, imageRefs } from '$lib/data/sheet-format/codec';
import { validSheetId } from '$lib/data/legacy-sheet';
import type { SheetDocumentV1 } from '$lib/data/sheet-format/types';
import { requireSameOrigin } from './ankh';
import {
  CHARACTER_COLLECTION,
  requireAegis,
  sheetMeta,
  storageCall,
  type AegisCursor,
  type WriteFailure,
} from './aegis';

const MAX_BODY = 512 * 1024 + 1024;
function invalid(message = 'Invalid request.'): never {
  error(400, { code: 'invalid_request', message });
}
const reply = (value: unknown, status = 200) =>
  json(value, { status, headers: { 'Cache-Control': 'no-store' } });
function identifier(value: unknown): asserts value is string {
  if (!validSheetId(value)) invalid('Invalid sheet ID.');
}
function version(value: unknown): asserts value is number {
  if (!Number.isSafeInteger(value) || (value as number) < 1)
    invalid('A positive integer storage version is required.');
}
async function readBody(event: RequestEvent, keys: string[]) {
  requireSameOrigin(event);
  if (
    event.request.headers.get('Content-Type')?.split(';')[0].trim().toLowerCase() !==
    'application/json'
  ) {
    error(415, { code: 'json_required', message: 'Send application/json.' });
  }
  const reader = event.request.body?.getReader();
  if (!reader) invalid('Missing JSON body.');
  let size = 0;
  const chunks: Uint8Array[] = [];
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_BODY) {
        void reader.cancel().catch(() => {});
        error(413, {
          code: 'payload_too_large',
          message: 'Sheet requests must fit within 512 KiB plus the request envelope.',
        });
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  let body: Record<string, unknown>;
  try {
    body = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes));
  } catch {
    invalid('Invalid JSON body.');
  }
  if (
    !body ||
    typeof body !== 'object' ||
    Array.isArray(body) ||
    Object.keys(body).some((key) => !keys.includes(key))
  )
    invalid();
  return body;
}
function validateSheet(value: unknown): asserts value is SheetDocumentV1 {
  try {
    assertSheet(value);
    // Bundle bytes are not stored in a single Aegis sheet. A dangling local attachment is never success.
    if (imageRefs(value).length) {
      error(422, {
        code: 'unresolved_images',
        message:
          'Local image attachments must be uploaded to account image storage before saving this sheet. Keep a game backup in the meantime.',
      });
    }
  } catch (caught) {
    if (caught && typeof caught === 'object' && 'status' in caught) throw caught;
    error(400, {
      code: 'invalid_sheet',
      message: 'The sheet format, fields or size are invalid. No changes were saved.',
    });
  }
}
function outcome(result: WriteFailure | { ok: true }, successStatus = 200) {
  if (result.ok) return reply(result, successStatus);
  if (result.reason === 'conflict')
    return reply({ error: 'conflict', currentVersion: result.currentVersion }, 409);
  if (result.reason === 'exists') return reply({ error: 'exists' }, 409);
  if (result.reason === 'not_found') return reply({ error: 'not_found' }, 404);
  return reply({ error: 'storage_quota', message: 'Your account storage allowance is full.' }, 507);
}
export async function listSheets(event: RequestEvent) {
  const { service, ctx } = requireAegis(event);
  const limitText = event.url.searchParams.get('limit') ?? '50';
  if (!/^\d+$/.test(limitText)) invalid('Invalid page limit.');
  const limit = Number(limitText);
  if (!Number.isSafeInteger(limit) || limit < 1 || limit > 100)
    invalid('Page limit must be between 1 and 100.');
  let cursor: AegisCursor | null = null;
  const text = event.url.searchParams.get('cursor');
  if (text) {
    if (text.length > 1024) invalid('Invalid cursor.');
    try {
      cursor = JSON.parse(text);
    } catch {
      invalid('Invalid cursor.');
    }
    if (
      !cursor ||
      typeof cursor !== 'object' ||
      Array.isArray(cursor) ||
      Object.keys(cursor).some((key) => !['docId', 'updatedAt'].includes(key)) ||
      !Number.isSafeInteger(cursor.updatedAt) ||
      cursor.updatedAt < 0 ||
      !validSheetId(cursor.docId)
    )
      invalid('Invalid cursor.');
  }
  const page = await storageCall(() => service.list(ctx, CHARACTER_COLLECTION, { limit, cursor }));
  return reply({ characters: page.items, nextCursor: page.nextCursor });
}
export async function getSheet(event: RequestEvent) {
  const { service, ctx } = requireAegis(event);
  const id = event.params.id;
  identifier(id);
  const result = await storageCall(() => service.get(ctx, CHARACTER_COLLECTION, id));
  if (!result.found) return reply({ error: 'not_found' }, 404);
  return reply({ sheet: result.doc });
}
export async function createSheet(event: RequestEvent) {
  requireAegis(event);
  const body = await readBody(event, ['sheet']);
  validateSheet(body.sheet);
  const { service, ctx } = requireAegis(event);
  const sheet = body.sheet;
  const result = await storageCall(() =>
    service.create(ctx, CHARACTER_COLLECTION, sheet.id, sheet, sheetMeta(sheet)),
  );
  return outcome(result, 201);
}
export async function updateSheet(event: RequestEvent) {
  requireAegis(event);
  const id = event.params.id;
  identifier(id);
  const body = await readBody(event, ['sheet', 'version']);
  validateSheet(body.sheet);
  version(body.version);
  if (body.sheet.id !== id) invalid('Sheet ID does not match the URL.');
  const { service, ctx } = requireAegis(event);
  const sheet = body.sheet;
  const expectedVersion = body.version;
  const result = await storageCall(() =>
    service.update(ctx, CHARACTER_COLLECTION, id, sheet, expectedVersion, sheetMeta(sheet)),
  );
  return outcome(result);
}
export async function deleteSheet(event: RequestEvent) {
  requireAegis(event);
  const id = event.params.id;
  identifier(id);
  const body = await readBody(event, ['version']);
  version(body.version);
  const { service, ctx } = requireAegis(event);
  const expectedVersion = body.version;
  const result = await storageCall(() =>
    service.delete(ctx, CHARACTER_COLLECTION, id, expectedVersion),
  );
  return outcome(result);
}
