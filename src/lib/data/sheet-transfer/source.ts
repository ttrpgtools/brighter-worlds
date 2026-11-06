import { collectBackupData, exportBackup } from '../sheet-backup';
import { encodeSheet, ExportContext, validateBundle } from '../sheet-format/codec';
import type { SheetBundleV1 } from '../sheet-format/types';
import {
  CHUNK_CHARS,
  ROOT_ORIGIN,
  OLD_ORIGIN,
  TRANSFER_IDLE_MS,
  TransferConnection,
  inventoryFor,
  type Incoming,
  type Inventory,
  type Peer,
  type TransferOutcome,
} from './protocol';
import type { UseStore } from 'idb-keyval';

export async function transferSheets(database?: UseStore) {
  const { sheets, warnings } = await collectBackupData(undefined, database);
  const summaries: { id: string; name: string; calling: string; companions: number }[] = [];
  for (const [id, raw] of sheets) {
    try {
      const { document } = await encodeSheet(raw, new ExportContext(OLD_ORIGIN), id);
      summaries.push({
        id,
        name: document.character.name,
        calling: document.character.calling.name,
        companions: document.relations.length,
      });
    } catch {
      warnings.push(`${id} needs original-record recovery and cannot be copied automatically.`);
    }
  }
  return { summaries, warnings: [...new Set(warnings)] };
}

export const exportTransferSelection = (ids: string[], database?: UseStore) =>
  // Selection click order must not create a different retry identity for the same content.
  exportBackup({ ids: [...new Set(ids)].sort(), origin: OLD_ORIGIN, database });

export class SourceTransfer extends TransferConnection {
  phase: 'connecting' | 'selecting' | 'offered' | 'sending' | 'review' | 'finished' = 'connecting';
  inventory?: Inventory;
  outcomes: TransferOutcome[] = [];
  private text = '';
  private ids = new Set<string>();
  private lastRequested = -1;
  private progressAt = 0;
  constructor(peer: Peer, session: string, changed: () => void, now?: () => number) {
    super(peer, ROOT_ORIGIN, session, changed, now);
  }
  tick() {
    if (
      this.check() &&
      ['offered', 'sending'].includes(this.phase) &&
      this.now() - this.progressAt >= TRANSFER_IDLE_MS
    )
      this.fail('The selected backup stalled. Download it or start a new transfer.');
  }
  receive(event: Incoming) {
    const message = this.read(event);
    if (!message || this.control(message)) return;
    if (message.op === 'hello') {
      this.connected = true;
      if (this.phase === 'connecting') this.phase = 'selecting';
      this.send({ op: 'ready' });
    } else if (
      message.op === 'request' &&
      this.inventory &&
      ['offered', 'sending'].includes(this.phase) &&
      message.digest === this.inventory.digest &&
      message.index < this.inventory.chunks &&
      (message.index === this.lastRequested + 1 || message.index === this.lastRequested)
    ) {
      this.lastRequested = message.index;
      this.progressAt = this.now();
      this.phase = 'sending';
      this.send({
        op: 'chunk',
        digest: message.digest,
        index: message.index,
        text: this.text.slice(message.index * CHUNK_CHARS, (message.index + 1) * CHUNK_CHARS),
      });
    } else if (
      message.op === 'review' &&
      this.phase === 'sending' &&
      this.lastRequested === (this.inventory?.chunks ?? 0) - 1
    ) {
      this.phase = 'review';
    } else if (
      message.op === 'result' &&
      this.phase === 'review' &&
      this.inventory &&
      message.digest === this.inventory.digest &&
      message.total === this.inventory.sheets &&
      message.offset === this.outcomes.length
    ) {
      const seen = new Set(this.outcomes.map((outcome) => outcome.id));
      for (const record of message.records) {
        if (!this.ids.has(record.id) || seen.has(record.id)) {
          this.fail('The result did not match the selected sheets. Check the destination library.');
          return;
        }
        seen.add(record.id);
      }
      this.outcomes.push(...message.records);
      if (this.outcomes.length === message.total) {
        this.phase = 'finished';
        this.ended = true;
      }
    }
    this.changed();
  }
  /** Only the explicit source-side Copy button calls this, after local review. */
  async offer(text: string) {
    if (!this.check() || !this.connected || this.phase !== 'selecting')
      throw new Error('Start a new transfer from brighterworlds.app, or download the backup.');
    const bundle: SheetBundleV1 = JSON.parse(text);
    await validateBundle(bundle);
    if (bundle.source.origin !== OLD_ORIGIN || bundle.source.storage !== 'browser-local')
      throw new Error('Expected a local backup from the old site.');
    const inventory = await inventoryFor(text, bundle.roots, bundle.sheets.length);
    if (!this.check() || this.phase !== 'selecting') return;
    this.text = text;
    this.ids = new Set(bundle.sheets.map((sheet) => sheet.id));
    this.inventory = inventory;
    this.phase = 'offered';
    this.progressAt = this.now();
    this.send({ op: 'inventory', inventory });
    this.changed();
  }
}
