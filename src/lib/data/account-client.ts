import type { AegisDoc, AegisListPage } from '$lib/server/aegis';
import type { SheetDocumentV1 } from './sheet-format/types';
import { assertSheet } from './sheet-format/codec';
export class AccountError extends Error {
  constructor(
    public code: string,
    message: string,
    public version?: number,
  ) {
    super(message);
  }
}
export function accountClient(owner: string, fetcher: typeof fetch = fetch) {
  async function call<T>(path: string, method = 'GET', body?: unknown): Promise<T> {
    let response: Response;
    try {
      response = await fetcher(path, {
        method,
        cache: 'no-store',
        headers: {
          'X-Brighter-Worlds-Owner': owner,
          ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
        },
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      });
    } catch {
      throw new AccountError(
        'network',
        'Offline or unable to reach account storage. Your draft is kept in this browser.',
      );
    }
    const data = await response.json().catch(() => ({}));
    if (!response.ok)
      throw new AccountError(
        data.error ?? 'network',
        data.message ??
          {
            409: 'This sheet changed elsewhere.',
            404: 'This sheet was removed online.',
            507: 'Your account storage allowance is full.',
            401: 'Sign in to save this draft.',
            403: 'This account cannot use storage.',
          }[response.status] ??
          'Account storage is unavailable.',
        data.currentVersion,
      );
    return data as T;
  }
  const path = (id: string) => `/api/characters/${encodeURIComponent(id)}`;
  return {
    async get(id: string) {
      const result = await call<{ sheet: AegisDoc }>(path(id));
      assertSheet(result.sheet.data);
      if (
        result.sheet.docId !== id ||
        result.sheet.data.id !== id ||
        !Number.isSafeInteger(result.sheet.version) ||
        result.sheet.version < 1
      )
        throw new AccountError('invalid_sheet', 'Invalid account document.');
      return result.sheet;
    },
    list: (cursor?: AegisListPage['nextCursor']) =>
      call<{ characters: AegisListPage['items']; nextCursor: AegisListPage['nextCursor'] }>(
        `/api/characters?limit=50${cursor ? `&cursor=${encodeURIComponent(JSON.stringify(cursor))}` : ''}`,
      ),
    create: (sheet: SheetDocumentV1) =>
      call<{ version: number; updatedAt: number }>('/api/characters', 'POST', { sheet }),
    update: (sheet: SheetDocumentV1, version: number) =>
      call<{ version: number; updatedAt: number }>(path(sheet.id), 'PUT', { sheet, version }),
    delete: (id: string, version: number) => call<{ ok: true }>(path(id), 'DELETE', { version }),
  };
}
export type AccountClient = ReturnType<typeof accountClient>;
export const accountHref = (owner: string, id: string) =>
  `/character/${encodeURIComponent(id)}?account=${encodeURIComponent(owner)}`;
