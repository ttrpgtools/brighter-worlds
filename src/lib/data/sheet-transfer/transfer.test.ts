import 'fake-indexeddb/auto';
import { createStore, entries, get, set, type UseStore } from 'idb-keyval';
import { beforeEach, describe, expect, it } from 'vitest';
import fixture from '../sheet-format/fixtures/bundle-v1.json';
import legacy from '../sheet-format/fixtures/legacy-root.json';
import { normalizeLegacySheet } from '../legacy-sheet';
import { prepareBackup } from '../sheet-backup';
import { DestinationTransfer, saveTransfer } from './destination';
import { exportTransferSelection, SourceTransfer, transferSheets } from './source';
import {
  CHUNK_CHARS,
  CONNECTION_MS,
  OLD_ORIGIN,
  ROOT_ORIGIN,
  SESSION_MS,
  TRANSFER_PROTOCOL,
  TRANSFER_IDLE_MS,
  inventoryFor,
  messageFrom,
  transferURL,
  type Peer,
  type TransferMessage,
} from './protocol';

let db: UseStore;
beforeEach(() => {
  db = createStore(`popup-${crypto.randomUUID()}`, 'keyval');
});
const text = JSON.stringify(fixture);

function pair(database: UseStore = db) {
  const queue: (() => void | Promise<void>)[] = [];
  const sent: TransferMessage[] = [];
  let time = 1000;
  let dropResults = false;
  let corruptChunk = false;
  let dropChunks = false;
  const session = crypto.randomUUID();
  const popup: Peer & { closed: boolean } = {
    closed: false,
    postMessage(data, origin) {
      expect(origin).toBe(OLD_ORIGIN);
      sent.push(data);
      if (data.op === 'result' && dropResults) return;
      queue.push(() => source.receive({ data, origin: ROOT_ORIGIN, source: opener }));
    },
  };
  const opener: Peer & { closed: boolean } = {
    closed: false,
    postMessage(data, origin) {
      expect(origin).toBe(ROOT_ORIGIN);
      sent.push(data);
      if (data.op === 'chunk' && dropChunks) return;
      if (data.op === 'chunk' && corruptChunk) data = { ...data, text: `X${data.text.slice(1)}` };
      queue.push(() => destination.receive({ data, origin: OLD_ORIGIN, source: popup }));
    },
  };
  const source = new SourceTransfer(
    opener,
    session,
    () => {},
    () => time,
  );
  const destination = new DestinationTransfer(
    popup,
    session,
    () => {},
    database,
    () => time,
  );
  async function pump() {
    let count = 0;
    while (queue.length) {
      if (++count > 2200) throw new Error('Message loop');
      await queue.shift()!();
    }
  }
  return {
    source,
    destination,
    popup,
    opener,
    session,
    sent,
    pump,
    advance(ms: number) {
      time += ms;
    },
    dropResults() {
      dropResults = true;
    },
    corruptChunks() {
      corruptChunk = true;
    },
    dropChunks() {
      dropChunks = true;
    },
    async connect() {
      destination.tick();
      await pump();
    },
    async preview(json = text) {
      destination.tick();
      await pump();
      await source.offer(json);
      await pump();
    },
    toDestination(data: unknown, origin = OLD_ORIGIN, source: unknown = popup) {
      return destination.receive({ data, origin, source });
    },
    toSource(data: unknown, origin = ROOT_ORIGIN, sourceWindow: unknown = opener) {
      source.receive({ data, origin, source: sourceWindow });
    },
    message(op: string, extra = {}) {
      return { protocol: TRANSFER_PROTOCOL, version: 1, session, op, ...extra };
    },
  };
}

describe('cross-origin channel and lifecycle', () => {
  it('uses a fixed source URL with only a fresh session fragment', () => {
    const first = transferURL(crypto.randomUUID());
    expect(new URL(first).origin).toBe(OLD_ORIGIN);
    expect(new URL(first).pathname).toBe('/migrate');
    expect(new URL(first).search).toBe('');
    expect(first).not.toBe(transferURL(crypto.randomUUID()));
    expect(() => transferURL('https://attacker.example')).toThrow();
  });
  it('shares no inventory or character payload until source-side confirmation', async () => {
    const p = pair();
    await p.connect();
    expect(p.sent.map((x) => x.op)).toEqual(['hello', 'ready']);
    p.toSource(p.message('request', { digest: '0'.repeat(64), index: 0 }));
    await p.pump();
    expect(p.sent.map((x) => x.op)).toEqual(['hello', 'ready']);
    await expect(new SourceTransfer(p.opener, p.session, () => {}).offer(text)).rejects.toThrow(
      'Start a new transfer',
    );
  });
  it.each(['origin', 'source', 'session', 'version', 'protocol', 'extra'])(
    'rejects messages with the wrong %s on both ends',
    async (field) => {
      const p = pair();
      const hello = p.message('hello');
      const ready = p.message('ready');
      const altered = (value: object) => ({
        ...value,
        ...(field === 'session' ? { session: crypto.randomUUID() } : {}),
        ...(field === 'version' ? { version: 2 } : {}),
        ...(field === 'protocol' ? { protocol: 'old-wildcard-bridge' } : {}),
        ...(field === 'extra' ? { payload: 'unsolicited' } : {}),
      });
      p.toSource(
        altered(hello),
        field === 'origin' ? `${ROOT_ORIGIN}.attacker.example` : ROOT_ORIGIN,
        field === 'source' ? {} : p.opener,
      );
      await p.toDestination(
        altered(ready),
        field === 'origin' ? `${OLD_ORIGIN}.attacker.example` : OLD_ORIGIN,
        field === 'source' ? {} : p.popup,
      );
      expect(p.source.phase).toBe('connecting');
      expect(p.destination.phase).toBe('connecting');
      expect(p.sent).toEqual([]);
    },
  );
  it.each(['closed', 'timeout', 'expired', 'cancelled'])(
    'ends a %s session and ignores later payloads',
    async (reason) => {
      const p = pair();
      await p.connect();
      if (reason === 'closed') p.popup.closed = true;
      else if (reason === 'timeout') p.advance(CONNECTION_MS);
      else if (reason === 'expired') p.advance(SESSION_MS);
      else p.destination.cancel();
      p.destination.tick();
      await p.toDestination(
        p.message('inventory', { inventory: await inventoryFor(text, ['hero_01'], 2) }),
      );
      expect(p.destination.ended).toBe(true);
      expect(p.destination.prepared).toBeUndefined();
      expect(await entries(db)).toEqual([]);
    },
  );
  it('does not let heartbeats extend the absolute session lifetime', async () => {
    const p = pair();
    for (let elapsed = 0; elapsed < SESSION_MS; elapsed += 10000) {
      await p.connect();
      p.advance(10000);
    }
    p.destination.tick();
    expect(p.destination.error).toContain('expired');
  });
  it('treats lost opener and a navigated/unresponsive opener as recoverable disconnects', async () => {
    const p = pair();
    await p.connect();
    p.opener.closed = true;
    p.source.tick();
    expect(p.source.error).toContain('closed');
    const next = pair();
    await next.connect();
    next.advance(CONNECTION_MS);
    next.source.tick();
    expect(next.source.error).toContain('did not respond');
  });
});

describe('bounded bundles and durable result acknowledgments', () => {
  it('previews a complete companion graph before saving or acknowledging any record', async () => {
    const p = pair();
    await p.preview();
    expect(p.destination.phase).toBe('preview');
    expect(p.source.phase).toBe('review');
    expect(p.destination.prepared?.statuses).toHaveLength(2);
    expect(p.sent.some((x) => x.op === 'result')).toBe(false);
    expect(await entries(db)).toEqual([]);
    await p.destination.save('copy');
    await p.pump();
    expect(p.source.phase).toBe('finished');
    expect(p.source.outcomes.every((x) => x.outcome === 'restored')).toBe(true);
    const hero = await get('bw-sheet-hero_01', db);
    expect(hero.abilities[0].companionSheetId).toBe('pip_01');
    expect((await get('bw-sheet-pip_01', db)).calling.image).toBeInstanceOf(Blob);
    const receipt = (await entries<string, { session?: string; digest?: string }>(db)).find(
      ([key]) => key.startsWith('bw-popup-transfer:'),
    );
    expect(receipt?.[1].session).toBe(p.session);
    expect(receipt?.[1].digest).toBe(p.destination.prepared?.digest);
    expect(p.destination.error).toBe('');
  });
  it('transfers Unicode content across multiple bounded chunks', async () => {
    const bundle = structuredClone(fixture);
    bundle.sheets[0].character.notes = '☀️🦎'.repeat(12000);
    const p = pair();
    await p.preview(JSON.stringify(bundle));
    expect(p.destination.received).toBeGreaterThan(1);
    const chunks = p.sent.filter((x) => x.op === 'chunk');
    expect(chunks.every((x) => x.text.length <= CHUNK_CHARS)).toBe(true);
    expect(p.destination.prepared?.bundle?.sheets[0].character.notes).toBe(
      bundle.sheets[0].character.notes,
    );
  });
  it('remaps the entire group on collision and safely retries a lost acknowledgment after edits and deletion', async () => {
    await set(
      'bw-sheet-hero_01',
      { ...normalizeLegacySheet(legacy, legacy.id), name: 'Existing copy' },
      db,
    );
    const p = pair();
    await p.preview();
    expect(p.destination.prepared?.statuses[0].state).toBe('conflict');
    p.dropResults();
    await p.destination.save('copy');
    await p.pump();
    expect(p.source.phase).toBe('review');
    const copiedHero = p.destination.outcomes.find((x) => x.id === 'hero_01')!.destinationId!;
    const copiedPip = p.destination.outcomes.find((x) => x.id === 'pip_01')!.destinationId!;
    expect((await get(`bw-sheet-${copiedHero}`, db)).abilities[0].companionSheetId).toBe(copiedPip);
    const hero = await get(`bw-sheet-${copiedHero}`, db);
    await set(`bw-sheet-${copiedHero}`, { ...hero, notes: 'Newer edits' }, db);
    const { del } = await import('idb-keyval');
    await del(`bw-sheet-${copiedPip}`, db);
    const retryBundle = { ...fixture, id: 'new-export', exportedAt: Date.now() };
    const retry = pair();
    await retry.preview(JSON.stringify(retryBundle));
    await retry.destination.save('copy');
    await retry.pump();
    expect(retry.source.phase).toBe('finished');
    expect(retry.source.outcomes.every((x) => x.outcome === 'already-processed')).toBe(true);
    expect(retry.destination.outcomes.find((x) => x.id === 'hero_01')?.destinationId).toBe(
      copiedHero,
    );
    expect((await get(`bw-sheet-${copiedHero}`, db)).notes).toBe('Newer edits');
    expect(await get(`bw-sheet-${copiedPip}`, db)).toBeUndefined();
    expect((await entries<string>(db)).filter(([key]) => key.startsWith('bw-sheet-'))).toHaveLength(
      2,
    );
  });
  it('reports skipped conflicts separately and does not link an unrelated companion', async () => {
    await set('bw-sheet-pip_01', { ...normalizeLegacySheet(legacy, legacy.id), id: 'pip_01' }, db);
    const p = pair();
    await p.preview();
    await p.destination.save('skip');
    await p.pump();
    expect(p.source.outcomes.find((x) => x.id === 'pip_01')?.outcome).toBe('kept-current');
    const hero = await get('bw-sheet-hero_01', db);
    expect(hero.abilities[0].companionSheetId).toBeUndefined();
    expect(hero.abilities[0].unresolvedCompanionId).toBe('pip_01');
  });
  it('never acknowledges partial writes after a quota failure and can retry the same preview', async () => {
    let fail = true;
    const failing: UseStore = (mode, callback) =>
      db(mode, (store) => {
        const add = store.add.bind(store);
        store.add = ((value: unknown, key?: IDBValidKey) => {
          if (fail && key === 'bw-sheet-pip_01')
            throw new DOMException('Quota', 'QuotaExceededError');
          return add(value, key);
        }) as IDBObjectStore['add'];
        return callback(store);
      });
    const p = pair(failing);
    await p.preview();
    await p.destination.save('copy');
    await p.pump();
    expect(p.destination.phase).toBe('preview');
    expect(p.destination.error).toContain('Quota');
    expect(p.source.phase).toBe('review');
    expect(await entries(db)).toEqual([]);
    expect(p.sent.some((x) => x.op === 'result')).toBe(false);
    fail = false;
    await p.destination.save('copy');
    await p.pump();
    expect(p.source.phase).toBe('finished');
    expect(p.destination.error).toBe('');
  });
  it('recovers if sheet commit succeeds but the popup provenance receipt fails', async () => {
    let fail = true;
    const failing: UseStore = (mode, callback) =>
      db(mode, (store) => {
        const put = store.put.bind(store);
        store.put = ((value: unknown, key?: IDBValidKey) => {
          if (fail && String(key).startsWith('bw-popup-transfer:'))
            throw new Error('Receipt quota');
          return put(value, key);
        }) as IDBObjectStore['put'];
        return callback(store);
      });
    const p = pair(failing);
    await p.preview();
    await p.destination.save('copy');
    expect(p.destination.outcomes).toEqual([]);
    expect(p.sent.some((x) => x.op === 'result')).toBe(false);
    expect(await get('bw-sheet-hero_01', db)).toBeDefined();
    fail = false;
    await p.destination.save('copy');
    await p.pump();
    expect(p.source.outcomes.every((x) => x.outcome === 'already-processed')).toBe(true);
    expect((await entries<string>(db)).filter(([key]) => key.startsWith('bw-sheet-'))).toHaveLength(
      2,
    );
  });
  it('detects changed destinations before committing and refreshes its preview for retry', async () => {
    const p = pair();
    await p.preview();
    await set(
      'bw-sheet-hero_01',
      { ...normalizeLegacySheet(legacy, legacy.id), name: 'Concurrent edit' },
      db,
    );
    await p.destination.save('copy');
    expect(p.destination.error).toContain('changed after preview');
    expect(p.destination.prepared?.statuses[0].state).toBe('conflict');
    expect(await get('bw-sheet-pip_01', db)).toBeUndefined();
    await p.destination.save('copy');
    await p.pump();
    expect(p.source.phase).toBe('finished');
    expect(p.destination.outcomes[0].destinationId).not.toBe('hero_01');
  });
  it('rejects corrupted chunks without writes', async () => {
    const p = pair();
    p.corruptChunks();
    await p.preview();
    expect(p.destination.error).toContain('changed in transit');
    expect(await entries(db)).toEqual([]);
  });
  it('rejects out-of-order chunks and unsolicited results', async () => {
    const p = pair();
    p.dropChunks();
    await p.preview();
    const digest = p.destination.inventory!.digest;
    await p.toDestination(p.message('chunk', { digest, index: 1, text: 'wrong part' }));
    p.toSource(
      p.message('result', {
        digest,
        offset: 0,
        total: 2,
        records: [{ id: 'hero_01', destinationId: 'fake', outcome: 'restored' }],
      }),
    );
    expect(p.destination.received).toBe(0);
    expect(p.source.outcomes).toEqual([]);
    expect(await entries(db)).toEqual([]);
  });
  it('times out stalled payloads even while the source still answers heartbeats', async () => {
    const p = pair();
    p.dropChunks();
    await p.preview();
    for (let elapsed = 0; elapsed < TRANSFER_IDLE_MS; elapsed += 10000) {
      p.destination.tick();
      await p.pump();
      p.advance(10000);
    }
    p.destination.tick();
    expect(p.destination.error).toContain('stalled');
    expect(await entries(db)).toEqual([]);
  });
  it('checks confirmed inventory against the complete bundle before preview', async () => {
    const p = pair();
    await p.connect();
    const info = await inventoryFor(text, ['hero_01'], 1);
    await p.toDestination(p.message('inventory', { inventory: info }));
    await p.toDestination(p.message('chunk', { digest: info.digest, index: 0, text }));
    expect(p.destination.error).toContain('confirmed selection');
    expect(p.destination.prepared).toBeUndefined();
    expect(await entries(db)).toEqual([]);
  });
  it('batches results for large selections and waits for every result on the source', async () => {
    const bundle = structuredClone(fixture);
    const template = bundle.sheets[1];
    bundle.sheets = Array.from({ length: 205 }, (_, index) => ({
      ...template,
      id: `sheet_${index}`,
    }));
    bundle.roots = bundle.sheets.map((x) => x.id);
    const p = pair();
    await p.preview(JSON.stringify(bundle));
    await p.destination.save('copy');
    await p.pump();
    expect(p.sent.filter((x) => x.op === 'result').map((x) => x.records.length)).toEqual([
      100, 100, 5,
    ]);
    expect(p.source.outcomes).toHaveLength(205);
    expect(p.source.phase).toBe('finished');
  });
});

describe('portable source selection and validation', () => {
  it('reads local sheets without account services, excludes corrupt records, and includes companion closure', async () => {
    const sourceDb = createStore(`old-site-${crypto.randomUUID()}`, 'keyval');
    const runtime = normalizeLegacySheet(legacy, legacy.id);
    const companion = { ...runtime, id: 'pip_01', name: 'Pip', abilities: [] };
    await set(`bw-sheet-${runtime.id}`, runtime, sourceDb);
    await set('bw-sheet-pip_01', companion, sourceDb);
    await set('bw-sheet-damaged', { name: 'Broken' }, sourceDb);
    await set('bw-account:v1:other:secret', { character: { name: 'Not local' } }, sourceDb);
    const before = await entries(sourceDb);
    const inventory = await transferSheets(sourceDb);
    expect(inventory.summaries.map((x) => x.name).sort()).toEqual(['Mara', 'Pip']);
    expect(inventory.warnings.join(' ')).toContain('damaged');
    const exported = await exportTransferSelection(['hero_01'], sourceDb);
    expect(exported.payload).toHaveProperty('roots', ['hero_01']);
    expect(exported.payload).toHaveProperty('sheets.length', 2);
    expect(exported.json).not.toContain(legacy.settings.discordWebhook);
    expect(exported.json).not.toContain('Not local');
    expect(await entries(sourceDb)).toEqual(before);
    const first = await exportTransferSelection(['pip_01', 'hero_01'], sourceDb);
    const second = await exportTransferSelection(['hero_01', 'pip_01'], sourceDb);
    expect((await prepareBackup(first.json, db)).digest).toBe(
      (await prepareBackup(second.json, db)).digest,
    );
    await expect(
      saveTransfer(await prepareBackup(exported.json, db), 'copy', crypto.randomUUID(), db),
    ).resolves.toHaveLength(2);
  });
  it('rejects malformed and oversized operation schemas before retaining data', async () => {
    const p = pair();
    const info = await inventoryFor(text, ['hero_01'], 2);
    for (const inventory of [
      { ...info, bytes: 16 * 1024 * 1024 + 1 },
      { ...info, chunks: 100000 },
      { ...info, sheets: 1001 },
      { ...info, roots: ['hero_01', 'hero_01'] },
      { ...info, roots: ['../../escape'] },
      { ...info, digest: 'not-a-digest' },
    ]) {
      expect(
        messageFrom(
          { origin: OLD_ORIGIN, source: p.popup, data: p.message('inventory', { inventory }) },
          p.popup,
          OLD_ORIGIN,
          p.session,
        ),
      ).toBeUndefined();
    }
    expect(
      messageFrom(
        {
          origin: OLD_ORIGIN,
          source: p.popup,
          data: p.message('chunk', {
            digest: info.digest,
            index: 0,
            text: 'a'.repeat(CHUNK_CHARS + 1),
          }),
        },
        p.popup,
        OLD_ORIGIN,
        p.session,
      ),
    ).toBeUndefined();
  });
  it('rejects a corrupt image on the source without sending character payloads', async () => {
    const p = pair();
    await p.connect();
    const broken = structuredClone(fixture);
    broken.assets[0].sha256 = '0'.repeat(64);
    await expect(p.source.offer(JSON.stringify(broken))).rejects.toThrow('checksum');
    expect(p.sent.some((x) => x.op === 'inventory' || x.op === 'chunk')).toBe(false);
  });
});
