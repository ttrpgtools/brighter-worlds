import type { UseStore } from 'idb-keyval';
import {
  prepareBackup,
  restoreBackup,
  type CollisionPolicy,
  type ImportOutcome,
  type PreparedBackup,
} from '../sheet-backup';
import { request, transaction } from '../storage-transaction';
import { utf8Size } from '../sheet-format/codec';
import {
  CHUNK_CHARS,
  OLD_ORIGIN,
  RESULT_BATCH,
  TRANSFER_IDLE_MS,
  TransferConnection,
  textDigest,
  validSession,
  type Incoming,
  type Inventory,
  type Peer,
} from './protocol';

/** The ordinary importer owns graph remapping, atomic writes and content-bound deduplication.
 * This additional receipt records popup provenance before acknowledging the destination save.
 * If this second transaction fails, retrying the importer remains safe.
 */
export async function saveTransfer(
  prepared: PreparedBackup,
  policy: CollisionPolicy,
  session: string,
  database?: UseStore,
) {
  if (
    !validSession(session) ||
    prepared.bundle?.source.origin !== OLD_ORIGIN ||
    prepared.bundle.source.storage !== 'browser-local' ||
    prepared.game.length
  )
    throw new Error('Expected a confirmed local character transfer from the old site.');
  const outcomes = await restoreBackup(prepared, policy, false, database);
  await transaction(
    'readwrite',
    async (store) => {
      const key = `bw-popup-transfer:v1:${session}:${prepared.digest}:${policy}`;
      store.put(
        { version: 1, origin: OLD_ORIGIN, session, digest: prepared.digest, policy, outcomes },
        key,
      );
      const saved = await request(store.get(key));
      if (saved?.digest !== prepared.digest || saved?.session !== session)
        throw new Error('The transfer receipt could not be verified. Retry safely.');
    },
    database,
  );
  return outcomes;
}

export class DestinationTransfer extends TransferConnection {
  phase:
    | 'connecting'
    | 'selecting'
    | 'receiving'
    | 'validating'
    | 'preview'
    | 'saving'
    | 'finished' = 'connecting';
  inventory?: Inventory;
  prepared?: PreparedBackup;
  outcomes: ImportOutcome[] = [];
  received = 0;
  private parts: string[] = [];
  private length = 0;
  private progressAt = 0;
  constructor(
    peer: Peer,
    session: string,
    changed: () => void,
    private database?: UseStore,
    now?: () => number,
  ) {
    super(peer, OLD_ORIGIN, session, changed, now);
  }
  tick() {
    if (!this.check()) return;
    if (
      ['receiving', 'validating'].includes(this.phase) &&
      this.now() - this.progressAt >= TRANSFER_IDLE_MS
    ) {
      this.fail('The incoming backup stalled. Try again or use a backup file.');
      return;
    }
    try {
      this.send({ op: 'hello' });
    } catch {
      this.fail('The old site could not be reached. Try again or use a backup file.');
    }
  }
  async receive(event: Incoming) {
    const message = this.read(event);
    if (!message || this.control(message)) return;
    if (message.op === 'ready') {
      this.connected = true;
      if (this.phase === 'connecting') this.phase = 'selecting';
    } else if (message.op === 'inventory' && this.connected && this.phase === 'selecting') {
      this.inventory = message.inventory;
      this.progressAt = this.now();
      this.phase = 'receiving';
      this.send({ op: 'request', digest: message.inventory.digest, index: 0 });
    } else if (
      message.op === 'chunk' &&
      this.phase === 'receiving' &&
      this.inventory &&
      message.digest === this.inventory.digest &&
      message.index === this.parts.length
    ) {
      const info = this.inventory;
      this.progressAt = this.now();
      this.length += message.text.length;
      if (
        this.length > info.bytes ||
        (message.index < info.chunks - 1 && message.text.length !== CHUNK_CHARS)
      ) {
        this.fail('The incoming backup exceeded its declared bounds. No sheets were saved.');
        return;
      }
      this.parts.push(message.text);
      this.received = this.parts.length;
      if (this.parts.length === info.chunks) {
        this.phase = 'validating';
        this.changed();
        const text = this.parts.join('');
        this.parts = [];
        try {
          if (utf8Size(text) !== info.bytes || (await textDigest(text)) !== info.digest)
            throw new Error(
              'The backup was incomplete or changed in transit. No sheets were saved.',
            );
          if (this.ended) return;
          // Reject other portable formats: this channel only copies a selected local sheet graph.
          const input = JSON.parse(text);
          if (
            input?.format !== 'brighter-worlds.bundle' ||
            input?.source?.origin !== OLD_ORIGIN ||
            input?.source?.storage !== 'browser-local'
          )
            throw new Error('This transfer is not a local character bundle from the old site.');
          const prepared = await prepareBackup(text, this.database);
          if (
            prepared.bundle?.sheets.length !== info.sheets ||
            JSON.stringify(prepared.bundle.roots) !== JSON.stringify(info.roots)
          )
            throw new Error('The received sheets did not match the confirmed selection.');
          if (!this.check()) return;
          this.prepared = prepared;
          this.phase = 'preview';
          this.send({ op: 'review' });
        } catch (caught) {
          this.fail(
            caught instanceof Error ? caught.message : 'The backup could not be validated.',
          );
        }
      } else this.send({ op: 'request', digest: info.digest, index: this.parts.length });
    }
    this.changed();
  }
  async save(policy: CollisionPolicy) {
    if (!this.prepared || this.phase !== 'preview' || !this.check()) return;
    this.error = '';
    this.phase = 'saving';
    this.changed();
    try {
      const outcomes = await saveTransfer(this.prepared, policy, this.session, this.database);
      // Always show durable outcomes locally, even if the source went away during the commit.
      this.outcomes = outcomes;
      this.phase = 'finished';
      if (this.check()) {
        for (let offset = 0; offset < outcomes.length; offset += RESULT_BATCH)
          this.send({
            op: 'result',
            digest: this.inventory!.digest,
            offset,
            total: outcomes.length,
            records: outcomes
              .slice(offset, offset + RESULT_BATCH)
              .map(({ name: _, ...row }) => row),
          });
      }
      this.ended = true;
    } catch (caught) {
      // Keep a preview available after quota/receipt/stale-destination failures; refresh before retry.
      if (!this.ended) {
        this.phase = 'preview';
        this.error = caught instanceof Error ? caught.message : 'No durable save was confirmed.';
        try {
          this.prepared = await prepareBackup(this.prepared.originalText, this.database);
        } catch {
          this.fail('Storage is unavailable. Download the received backup and retry later.');
        }
      }
    }
    this.changed();
  }
}
