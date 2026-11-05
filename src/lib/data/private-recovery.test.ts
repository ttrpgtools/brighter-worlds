import 'fake-indexeddb/auto';
import { createStore, set, type UseStore } from 'idb-keyval';
import { expect, it } from 'vitest';
import { privateRecoveryFile, recoveryGraph } from './private-recovery';
import { prepareBackup } from './sheet-backup';

it('preserves native collections, cyclic references and arbitrary Blob bytes for private/manual recovery', async () => {
  const cycle: Record<string, unknown> = {};
  cycle.self = cycle;
  const graph = await recoveryGraph({
    statuses: new Set(['Custom']),
    date: new Date(1000),
    map: new Map([['key', 1]]),
    cycle,
    image: new Blob(['not a portable raster'], { type: 'custom/type' }),
  });
  const json = JSON.stringify(graph);
  expect(json).toContain('Custom');
  expect(graph.nodes.some((x) => x.kind === 'Set')).toBe(true);
  expect(graph.nodes.some((x) => x.kind === 'Date' && x.value === 1000)).toBe(true);
  const image = graph.nodes.find((x) => x.kind === 'Blob')!;
  expect(atob(image.data as string)).toBe('not a portable raster');
  const cycleNode = graph.nodes.find(
    (x) => x.kind === 'Object' && JSON.stringify(x.entries).includes('self'),
  )!;
  const index = graph.nodes.indexOf(cycleNode);
  expect(cycleNode.entries).toEqual([['self', { ref: index }]]);
});

it('downloads damaged IndexedDB data without normalizing or writing it and marks the archive as private', async () => {
  const db = createStore(`private-${crypto.randomUUID()}`, 'keyval');
  await set(
    'bw-sheet-damaged',
    { settings: { discordWebhook: 'private-sentinel' }, invalid: true },
    db,
  );
  const readonly: UseStore = (mode, run) => {
    expect(mode).toBe('readonly');
    return db(mode, run);
  };
  const json = await privateRecoveryFile(undefined, readonly);
  expect(json).toContain('private-sentinel');
  expect(JSON.parse(json)).toMatchObject({
    format: 'brighter-worlds.private-recovery',
    version: 2,
  });
  await expect(prepareBackup(json, db)).rejects.toThrow('manual recovery');
});
