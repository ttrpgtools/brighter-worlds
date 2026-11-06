import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { validateBundle } from '../src/lib/data/sheet-format/compiled-validators.js';

// Synthetic files only. This script never opens a browser or writes application storage.
const source = 'src/lib/data/sheet-format/fixtures';
const destination = 'private/rollout-fixtures';
const load = async (name) => JSON.parse(await readFile(join(source, name), 'utf8'));
const bundle = await load('bundle-v1.json');
assert.ok(validateBundle(bundle), 'The portable fixture must pass the current schema');
const account = structuredClone(bundle);
account.id = 'rollout_account';
account.assets = [];
function useImageURLs(value) {
  if (!value || typeof value !== 'object') return;
  if (value.kind === 'bundle-asset') {
    delete value.assetId;
    value.kind = 'url';
    value.url = 'https://example.invalid/rollout-fixture.png';
  } else Object.values(value).forEach(useImageURLs);
}
useImageURLs(account.sheets);
assert.ok(validateBundle(account), 'The account-ready fixture must pass the current schema');
const divergent = structuredClone(account);
divergent.id = 'rollout_divergent';
divergent.sheets[0].character.notes += '\nDifferent destination edit: retain this version.';
assert.ok(validateBundle(divergent));
const future = { ...bundle, version: 999 };
assert.equal(validateBundle(future), false, 'The future-version fixture must be rejected');
const corruptImage = structuredClone(bundle);
corruptImage.id = 'rollout_corrupt_image';
corruptImage.assets[0].data = 'corrupt';

const files = new Map([
  ['linked-with-image.json', bundle],
  ['account-ready.json', account],
  ['divergent-copy.json', divergent],
  ['reject-future-version.json', future],
  ['reject-corrupt-image.json', corruptImage],
]);
for (const era of ['root', 'dev']) {
  const hero = await load(`legacy-${era}.json`);
  const companion = structuredClone(hero);
  companion.id = 'pip_01';
  companion.name = 'Pip';
  companion.abilities = [];
  companion.calling = { id: 'fox', name: 'Fox' };
  const orphan = { ...structuredClone(companion), id: 'orphan_01', name: 'Orphan fixture' };
  files.set(`legacy-${era}-storage.json`, {
    description:
      'Raw localStorage key/value fixture for a DISPOSABLE browser profile; not an import file.',
    origin: era === 'root' ? 'https://brighterworlds.app' : 'https://dev.brighterworlds.app',
    entries: {
      'bw-sheet-list': JSON.stringify([
        { id: hero.id, name: hero.name },
        { id: companion.id, name: companion.name },
        { id: 'missing_01', name: 'List-only fixture' },
      ]),
      [`bw-sheet-${hero.id}`]: JSON.stringify(hero),
      'bw-sheet-pip_01': JSON.stringify(companion),
      'bw-sheet-orphan_01': JSON.stringify(orphan),
      'bw-sheet-corrupt_01': '{"broken":',
      'bw-sheet-mismatch_01': JSON.stringify({ ...orphan, id: 'other_01' }),
    },
  });
}
await mkdir(destination, { recursive: true });
const manifest = [];
for (const [name, data] of files) {
  const json = JSON.stringify(data, null, 2) + '\n';
  await writeFile(join(destination, name), json);
  manifest.push({ name, sha256: createHash('sha256').update(json).digest('hex') });
}
await writeFile(join(destination, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
console.log(`Prepared ${files.size} synthetic fixture files in ${destination}.`);
console.log(
  'Use only in disposable test profiles. No browser data, account data or hosting was changed.',
);
