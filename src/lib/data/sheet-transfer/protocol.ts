import { validSheetId } from '../legacy-sheet';
import { hash, MAX_BACKUP_BYTES, utf8Size } from '../sheet-format/codec';
import type { ImportOutcome } from '../sheet-backup';

export const ROOT_ORIGIN = 'https://brighterworlds.app';
export const OLD_ORIGIN = 'https://dev.brighterworlds.app';
export const TRANSFER_PROTOCOL = 'brighter-worlds.sheet-transfer';
export const CHUNK_CHARS = 32 * 1024;
export const MAX_SHEETS = 1000;
export const SESSION_MS = 30 * 60 * 1000;
export const CONNECTION_MS = 20 * 1000;
export const TRANSFER_IDLE_MS = 60 * 1000;
export const RESULT_BATCH = 100;
export const validSession = (value: unknown): value is string =>
  typeof value === 'string' && /^[a-f0-9]{8}(-[a-f0-9]{4}){3}-[a-f0-9]{12}$/.test(value);
export const transferURL = (session: string) => {
  if (!validSession(session)) throw new Error('Invalid transfer session.');
  return `${OLD_ORIGIN}/migrate#${session}`;
};

export interface Inventory {
  digest: string;
  bytes: number;
  chunks: number;
  sheets: number;
  roots: string[];
}
export type TransferOutcome = Omit<ImportOutcome, 'name'>;
type Operation =
  | { op: 'hello' | 'ready' | 'review' | 'cancel' }
  | { op: 'inventory'; inventory: Inventory }
  | { op: 'request'; digest: string; index: number }
  | { op: 'chunk'; digest: string; index: number; text: string }
  | { op: 'result'; digest: string; offset: number; total: number; records: TransferOutcome[] }
  | { op: 'error'; message: string };
export type TransferMessage = Operation & {
  protocol: typeof TRANSFER_PROTOCOL;
  version: 1;
  session: string;
};
export interface Peer {
  readonly closed: boolean;
  postMessage(message: TransferMessage, targetOrigin: string): void;
}
export interface Incoming {
  origin: string;
  source: unknown;
  data: unknown;
}
const object = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === 'object' && !Array.isArray(value);
const integer = (value: unknown, min: number, max: number): value is number =>
  Number.isSafeInteger(value) && (value as number) >= min && (value as number) <= max;
const digest = (value: unknown): value is string =>
  typeof value === 'string' && /^[a-f0-9]{64}$/.test(value);
const keys = (value: Record<string, unknown>, fields: string[]) =>
  Object.keys(value).length === fields.length && fields.every((field) => field in value);
const outcome = (value: unknown) =>
  object(value) &&
  Object.keys(value).every((key) => ['id', 'destinationId', 'outcome'].includes(key)) &&
  validSheetId(value.id) &&
  (value.destinationId === undefined || validSheetId(value.destinationId)) &&
  ['restored', 'already-present', 'kept-current', 'already-processed'].includes(
    value.outcome as string,
  ) &&
  (value.outcome === 'kept-current' ||
    value.outcome === 'already-processed' ||
    validSheetId(value.destinationId));

/** Check the envelope before accessing any operation payload. Unknown fields are rejected. */
export function messageFrom(
  event: Incoming,
  peer: Peer,
  origin: string,
  session: string,
): TransferMessage | undefined {
  if (event.origin !== origin || event.source !== peer) return;
  const value = event.data;
  if (
    !object(value) ||
    value.protocol !== TRANSFER_PROTOCOL ||
    value.version !== 1 ||
    value.session !== session ||
    !validSession(value.session)
  )
    return;
  const base = ['protocol', 'version', 'session', 'op'];
  let valid = false;
  switch (value.op) {
    case 'hello':
    case 'ready':
    case 'review':
    case 'cancel':
      valid = keys(value, base);
      break;
    case 'inventory': {
      const info = value.inventory;
      valid =
        keys(value, [...base, 'inventory']) &&
        object(info) &&
        keys(info, ['digest', 'bytes', 'chunks', 'sheets', 'roots']) &&
        digest(info.digest) &&
        integer(info.bytes, 1, MAX_BACKUP_BYTES) &&
        integer(info.chunks, 1, Math.ceil(MAX_BACKUP_BYTES / CHUNK_CHARS)) &&
        integer(info.sheets, 1, MAX_SHEETS) &&
        Array.isArray(info.roots) &&
        info.roots.length > 0 &&
        info.roots.length <= info.sheets &&
        info.roots.every(validSheetId) &&
        new Set(info.roots).size === info.roots.length;
      break;
    }
    case 'request':
    case 'chunk':
      valid =
        keys(value, [...base, 'digest', 'index', ...(value.op === 'chunk' ? ['text'] : [])]) &&
        digest(value.digest) &&
        integer(value.index, 0, Math.ceil(MAX_BACKUP_BYTES / CHUNK_CHARS) - 1) &&
        (value.op === 'request' ||
          (typeof value.text === 'string' &&
            value.text.length > 0 &&
            value.text.length <= CHUNK_CHARS));
      break;
    case 'result':
      valid =
        keys(value, [...base, 'digest', 'offset', 'total', 'records']) &&
        digest(value.digest) &&
        integer(value.total, 1, MAX_SHEETS) &&
        integer(value.offset, 0, MAX_SHEETS - 1) &&
        Array.isArray(value.records) &&
        value.records.length > 0 &&
        value.records.length <= RESULT_BATCH &&
        value.records.every(outcome) &&
        (value.offset as number) + value.records.length <= (value.total as number);
      break;
    case 'error':
      valid =
        keys(value, [...base, 'message']) &&
        typeof value.message === 'string' &&
        value.message.length > 0 &&
        value.message.length <= 500;
      break;
  }
  return valid ? (value as unknown as TransferMessage) : undefined;
}

export const textDigest = (text: string) => hash(new TextEncoder().encode(text));
export async function inventoryFor(text: string, roots: string[], sheets: number) {
  const bytes = utf8Size(text);
  if (!bytes || bytes > MAX_BACKUP_BYTES) throw new Error('Transfer at most 16 MiB at a time.');
  return {
    digest: await textDigest(text),
    bytes,
    chunks: Math.ceil(text.length / CHUNK_CHARS),
    roots,
    sheets,
  } satisfies Inventory;
}

/** Lifecycle and window checks are shared by both ends; all outbound origins are constants. */
export abstract class TransferConnection {
  protected lastSeen: number;
  private started: number;
  protected connected = false;
  ended = false;
  error = '';
  constructor(
    protected peer: Peer,
    protected origin: string,
    protected session: string,
    protected changed: () => void,
    protected now: () => number = Date.now,
  ) {
    if (!validSession(session)) throw new Error('Invalid transfer session.');
    this.started = this.lastSeen = now();
  }
  protected send(operation: Operation) {
    if (this.ended) return;
    this.peer.postMessage(
      { ...operation, protocol: TRANSFER_PROTOCOL, version: 1, session: this.session },
      this.origin,
    );
  }
  protected read(event: Incoming) {
    if (!this.check()) return;
    const message = messageFrom(event, this.peer, this.origin, this.session);
    if (message) this.lastSeen = this.now();
    return message;
  }
  protected check() {
    if (this.ended) return false;
    if (this.peer.closed) this.fail('The other window closed or lost its connection.');
    else if (this.now() - this.started >= SESSION_MS) this.fail('This transfer session expired.');
    else if (this.now() - this.lastSeen >= CONNECTION_MS)
      this.fail('The other window did not respond. Try again or use a backup file.');
    return !this.ended;
  }
  fail(message: string) {
    if (this.ended) return;
    try {
      this.send({ op: 'error', message: message.slice(0, 500) });
    } catch {
      /* The window may have navigated away. */
    }
    this.error = message;
    this.ended = true;
    this.changed();
  }
  cancel() {
    if (this.ended) return;
    try {
      this.send({ op: 'cancel' });
    } catch {
      /* The peer may no longer be reachable. */
    }
    this.ended = true;
  }
  protected control(message: TransferMessage) {
    if (message.op === 'cancel') {
      this.fail('The transfer was stopped. Originals are still on the old site.');
      return true;
    }
    if (message.op === 'error') {
      this.fail(message.message);
      return true;
    }
    return false;
  }
}
