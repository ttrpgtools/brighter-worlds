import { entries, type UseStore } from 'idb-keyval';
import { get } from 'svelte/store';
import type { SheetCache } from './sheet-manager';
import { sheetDatabase } from './storage-transaction';
import { snapshotState } from '$lib/util/snapshot.svelte';

const gameKeys = [
  'bw-gm-npcs',
  'bw-gm-relics',
  'bw-encounters',
  'bw-playmat',
  'bw-gm-scenes',
  'bw-gm-tables',
  'bw-gm-friends',
  'bw-rolllog2',
  'bw-player-log',
];
const included = (key: string) =>
  key.startsWith('bw-sheet-') || key.startsWith('bw-recovery:') || gameKeys.includes(key);
function base64(bytes: Uint8Array) {
  let value = '';
  for (let i = 0; i < bytes.length; i += 8192)
    value += String.fromCharCode(...bytes.subarray(i, i + 8192));
  return btoa(value);
}

/** Tagged graph, for private/manual recovery only. No game or portable-format coercion. */
export async function recoveryGraph(value: unknown) {
  const seen = new Map<object, number>();
  const nodes: Record<string, unknown>[] = [];
  async function visit(input: unknown): Promise<unknown> {
    if (input === undefined) return { scalar: 'undefined' };
    if (typeof input === 'bigint') return { scalar: 'bigint', value: input.toString() };
    if (typeof input === 'number' && !Number.isFinite(input))
      return { scalar: 'number', value: String(input) };
    if (input === null || typeof input !== 'object') return input;
    const existing = seen.get(input);
    if (existing !== undefined) return { ref: existing };
    const id = nodes.length;
    const node: Record<string, unknown> = {};
    nodes.push(node);
    seen.set(input, id);
    if (input instanceof Blob)
      Object.assign(node, {
        kind: 'Blob',
        mediaType: input.type,
        data: base64(new Uint8Array(await input.arrayBuffer())),
      });
    else if (input instanceof Set)
      Object.assign(node, { kind: 'Set', values: await Promise.all([...input].map(visit)) });
    else if (input instanceof Map)
      Object.assign(node, {
        kind: 'Map',
        entries: await Promise.all(
          [...input].map(async ([key, val]) => [await visit(key), await visit(val)]),
        ),
      });
    else if (input instanceof Date) Object.assign(node, { kind: 'Date', value: input.getTime() });
    else if (input instanceof RegExp)
      Object.assign(node, { kind: 'RegExp', source: input.source, flags: input.flags });
    else if (input instanceof ArrayBuffer || ArrayBuffer.isView(input)) {
      const bytes =
        input instanceof ArrayBuffer
          ? new Uint8Array(input)
          : new Uint8Array(input.buffer, input.byteOffset, input.byteLength);
      Object.assign(node, { kind: 'Buffer', view: input.constructor.name, data: base64(bytes) });
    } else if (Array.isArray(input))
      Object.assign(node, { kind: 'Array', values: await Promise.all(input.map(visit)) });
    else
      Object.assign(node, {
        kind: 'Object',
        entries: await Promise.all(
          Object.entries(input).map(async ([key, val]) => [key, await visit(val)]),
        ),
      });
    return { ref: id };
  }
  return { root: await visit(value), nodes };
}

export async function privateRecoveryFile(
  cache?: SheetCache,
  database: UseStore = sheetDatabase,
  storage?: Storage,
) {
  const records: { storage: string; key: string; value: unknown }[] = [];
  const warnings: string[] = [];
  let local = storage;
  try {
    local ??= typeof window === 'undefined' ? undefined : window.localStorage;
  } catch {
    warnings.push('Original localStorage could not be read.');
  }
  try {
    if (local) {
      for (let i = 0; i < local.length; i++) {
        const key = local.key(i);
        if (key && included(key))
          records.push({ storage: 'localStorage', key, value: local.getItem(key) });
      }
    }
  } catch {
    warnings.push('Some localStorage records could not be read.');
  }
  try {
    for (const [key, value] of await entries<IDBValidKey, unknown>(database)) {
      if (typeof key === 'string' && included(key))
        records.push({ storage: 'indexedDB', key, value: await recoveryGraph(value) });
    }
  } catch {
    warnings.push('IndexedDB records could not be read. Other records remain included.');
  }
  for (const [id, store] of cache ?? [])
    records.push({
      storage: 'open-sheet',
      key: `bw-sheet-${id}`,
      value: await recoveryGraph(snapshotState(get(store))),
    });
  return JSON.stringify(
    { format: 'brighter-worlds.private-recovery', version: 2, warnings, records },
    null,
    2,
  );
}
