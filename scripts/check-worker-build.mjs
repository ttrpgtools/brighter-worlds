import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, readdir, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

// Local validation only. No deployment, service RPC or Cloudflare API call.
process.env.WRANGLER_LOG_PATH ??= join(tmpdir(), 'bwo-worker-check.log');
const { unstable_readConfig: readConfig } = await import('wrangler');

const targets = [
  { env: undefined, name: 'brighter-worlds-dev', domain: 'dev.brighterworlds.app' },
  { env: 'production', name: 'brighter-worlds', domain: 'brighterworlds.app' },
];
for (const target of targets) {
  const config = readConfig({ config: 'wrangler.jsonc', env: target.env });
  assert.equal(config.name, target.name, 'Worker target name changed');
  assert.ok(config.compatibility_flags.includes('nodejs_als'), 'SvelteKit needs AsyncLocalStorage');
  assert.equal(config.workers_dev, false, 'Unexpected public workers.dev origin');
  assert.equal(config.preview_urls, false, 'Unexpected public preview origin');
  assert.equal(config.assets.binding, 'ASSETS');
  assert.equal(config.assets.run_worker_first, true, 'Application routes must reach SvelteKit');
  assert.equal(config.vars.PUBLIC_ANKH, 'https://ankh.ttrpg.tools');
  assert.deepEqual(
    config.services,
    [
      { binding: 'AUTH', service: 'ankh', entrypoint: 'AuthService', props: { appId: 'bwo' } },
      { binding: 'STORE', service: 'aegis', entrypoint: 'Aegis', props: { appId: 'bwo' } },
    ],
    'Both environments must preserve the named services and trusted bwo scope',
  );
  for (const route of config.routes ?? []) {
    assert.equal(route.pattern, target.domain, 'A Worker must not take over the other origin');
    assert.equal(route.custom_domain, true, 'The Worker is the application origin');
  }
}

for (const target of targets) {
  const recovery = readConfig({ config: 'wrangler.recovery.jsonc', env: target.env });
  assert.equal(recovery.name, target.name, 'Recovery must preserve the intended Worker identity');
  assert.ok(recovery.compatibility_flags.includes('nodejs_als'));
  assert.deepEqual(recovery.services, [], 'Recovery must not write through live account services');
  assert.equal(recovery.main, readConfig({ config: 'wrangler.jsonc', env: target.env }).main);
  assert.equal(recovery.assets.binding, 'ASSETS');
  assert.equal(recovery.assets.run_worker_first, true);
  assert.equal(recovery.vars.PUBLIC_ANKH, 'https://ankh.ttrpg.tools');
  assert.equal(recovery.workers_dev, false);
  assert.equal(recovery.preview_urls, false);
  for (const route of recovery.routes ?? []) {
    assert.equal(route.pattern, target.domain, 'Recovery must not take over the other origin');
    assert.equal(route.custom_domain, true);
  }
}

const ignored = (await readFile('.svelte-kit/cloudflare/.assetsignore', 'utf8'))
  .split(/\r?\n/)
  .map((line) => line.trim());
for (const filename of ['_worker.js', '_routes.json', '_headers', '_redirects']) {
  assert.ok(ignored.includes(filename), `${filename} must not be uploaded as a public asset`);
}
const worker = await readFile('.svelte-kit/cloudflare/_worker.js');
assert.ok(worker.length > 0, 'Worker entrypoint is empty');
assert.ok((await stat('.svelte-kit/cloudflare/_app')).isDirectory(), 'Client assets are missing');
async function fingerprint(root) {
  const hash = createHash('sha256');
  let files = 0;
  async function visit(relative = '') {
    const entries = await readdir(join(root, relative), { withFileTypes: true });
    for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name, 'en'))) {
      const path = join(relative, entry.name);
      if (entry.isDirectory()) await visit(path);
      else if (entry.isFile()) {
        const bytes = await readFile(join(root, path));
        hash.update(JSON.stringify([path, bytes.length]));
        hash.update(bytes);
        files++;
      }
    }
  }
  await visit();
  return { files, sha256: hash.digest('hex') };
}
console.log(
  JSON.stringify(
    {
      result: 'Local Worker configuration and build checks passed',
      targets: targets.map(({ name }) => name),
      recoveryTargets: targets.map(({ name }) => name),
      entrypointBytes: worker.length,
      entrypointSha256: createHash('sha256').update(worker).digest('hex'),
      server: await fingerprint('.svelte-kit/output/server'),
      assetsAndEntrypoint: await fingerprint('.svelte-kit/cloudflare'),
      liveDeploymentVerified: false,
    },
    null,
    2,
  ),
);
