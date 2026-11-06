# Dev-first Worker rollout

Status: **prepared locally; no live deployment or domain cutover performed**. The owner requested Worker hosting on 6 November 2026 and selected dev first, with root after validation. This runbook and the repository changes implement the shared build/configuration work. The remaining live gates below are intentionally open.

## Candidate and build targets

The starting application checkpoint is `dfb4986dafcc422da891c22a608336b30a76af59` (`npc-sheets`, Migration path), with a clean working tree before this task. The candidate additionally includes the uncommitted Worker/configuration/runbook changes. Record the eventual reviewed commit and fresh artifact fingerprints at execution; the starting SHA alone does not identify the candidate.

- `pnpm build` now targets Workers. `pnpm build:worker` is an alias. The installed SvelteKit Cloudflare adapter already supports Workers Static Assets; no framework upgrade is needed.
- `wrangler.jsonc` defaults to **brighter-worlds-dev**. The explicit `production` environment names **brighter-worlds** for the later root migration. Both configure `AUTH → ankh#AuthService`, `STORE → aegis#Aegis`, trusted `props.appId = bwo`, `ASSETS`, and `run_worker_first = true`. Production bindings/vars are repeated because named environments do not inherit them.
- Both targets initially have `routes: []`, `workers_dev: false`, and `preview_urls: false`. Building or deploying an unrouted Worker does not switch a domain. Adding the dev Custom Domain is a separate, reviewable live cutover. Root has no domain configuration until its own gate.
- `pnpm build:pages` explicitly selects `wrangler.pages.jsonc`. This preserves a compatibility build for the transition; it does not imply that the historical deployed Pages code is safe after new writes.
- `wrangler.recovery.jsonc` names the same dev Worker and serves the same compatible app without `AUTH`/`STORE`. It is a prepared recovery deployment configuration, not an executed rollback. Preserve the active dev Custom Domain in that file before an authorized recovery deployment. Local sheets, cached drafts, `/migrate`, exports and private recovery remain available while cloud operations fail closed.
- Wrangler 4.98.0 is pinned as a direct development dependency and locked. `pnpm check:worker` checks both target identities, binding entrypoints/props, domain separation, request dispatch, client files and server-source asset exclusions. It fingerprints the server and asset trees. It rejects a Pages build lacking the Worker asset exclusions.

Local preparation commands (no deployment or browser seeding):

```sh
pnpm install --frozen-lockfile
pnpm check
pnpm test:unit --run
pnpm prepare:rollout-fixtures
pnpm build:pages
# Inspect/save this compatibility result before replacing its output.
pnpm build
pnpm check:worker
pnpm dry-run:worker
pnpm exec wrangler deploy --config wrangler.jsonc --env production --dry-run
pnpm exec wrangler deploy --config wrangler.recovery.jsonc --dry-run
```

Do not run the two build targets concurrently: they share `.svelte-kit`. Every target writes the same output directory; finish on the Worker build. The dry-run commands compile and inspect without uploading. A dry run does not prove deployed entrypoints, account policy, trusted-property delivery or live browser behavior. Keep logs local; never attach credentials, cookies, real character files or private recovery archives to evidence.

## Current hosting evidence and prerequisites

See [rollout-evidence.md](rollout-evidence.md) for the dated refresh and [hosting-inventory.md](hosting-inventory.md) for the original Pages deployment checkpoints. On 6 November, root/dev/www still had their original proxied Pages CNAMEs; both live `/migrate` routes returned 404. The new transfer application is not live. Initial Wrangler credential failures were resolved when the owner renamed/updated the audit token to `X_CF_API_TOKEN`: explicit read-only API requests now verify Pages settings, Worker names, an empty zone Worker-route list, and the deployed Ankh/Aegis exports/origin registration. Runtime RPC, consumer binding-property delivery and account/browser tests remain pending.

The refreshed account is `d9c1c6fe41907455f2a1709de422b29d`. Neither intended application Worker name is currently present. Use this existing account and the existing `ttrpgtools/brighter-worlds` repository. The local audit token is read explicitly; it is not copied into a Worker runtime or Git build variable. Workers Builds has its own deployment identity. At execution, refresh and record:

1. Pages production/latest deployment IDs, source SHA, build settings, both custom-domain attachments and Git auto-deploy policy. The historical project deploys on pushes to `main` and previews other branches; a push can be a release action. Keep root on its recorded release throughout the dev gate. If Pages must build new source during the transition, explicitly select `pnpm build:pages` in a separately authorized settings change.
2. Worker names/versions and existing routes/Custom Domains, checking for a name collision before creating **brighter-worlds-dev**. Save the exact dev CNAME and domain attachment metadata. Do not overwrite an unrelated Worker with the same name.
3. Deployed Ankh `bwo` registration for exact root/dev origins; host-local cookie/completion/access contract; deployed exports `AuthService` and `Aegis`; Aegis's allowed-app policy if configured. Local source and dry-run configuration cannot establish these facts. No app secret, wildcard origin, parent-domain cookie or privileged migration service substitutes for trusted binding props.
4. Candidate commit/diff, dependency lock hash, build fingerprints, compatibility/recovery artifact checkpoint and account test identities. Use synthetic sheets and dedicated test accounts. Live account writes, deletions and failure injection need authorization for that environment and data.

The current request authorizes implementation/preparation. The user-provided AGENTS.md requires an explicit current request for deployment/upload, Git history actions and hosting mutations. No such commands below have been run. Dev-server startup also requires permission; the existing local server may be used, but this task does not start another.

## Git integration setup

The owner prefers automatic Cloudflare deployments from Git. Use **Workers Builds** connected to the existing repository, rather than replacing that workflow with routine local deployments. The GitHub App named **Cloudflare Workers & Pages** is shared between Pages and Workers; a new repository or GitHub App installation should not be necessary if the existing installation already grants this repo. The new Worker application/build connection is separate from the Pages project. See [GitHub integration](https://developers.cloudflare.com/workers/ci-cd/builds/git-integration/github-integration/) and [Build configuration](https://developers.cloudflare.com/workers/ci-cd/builds/configuration/).

Prepared settings (not applied):

| Setting                              | Dev Worker now                                                                | Root Worker after dev sign-off                                       |
| ------------------------------------ | ----------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| Account                              | `d9c1c6fe41907455f2a1709de422b29d`                                            | Same                                                                 |
| Worker application                   | `brighter-worlds-dev`                                                         | `brighter-worlds`                                                    |
| Repository                           | `ttrpgtools/brighter-worlds` (GitHub repo ID `593472399`, org ID `126936601`) | Same                                                                 |
| Production branch for this Worker    | Existing `npc-sheets` branch                                                  | `main`, only after its separately authorized consolidation           |
| Project root                         | Repository root                                                               | Repository root                                                      |
| Build command                        | `pnpm build:ci`                                                               | `pnpm build:ci`                                                      |
| Deploy command                       | `pnpm exec wrangler deploy --config wrangler.jsonc`                           | `pnpm exec wrangler deploy --config wrangler.jsonc --env production` |
| Preview/non-production branch builds | Disabled initially                                                            | Disabled initially                                                   |
| Public domain                        | Add `dev.brighterworlds.app` only at cutover                                  | Add `brighterworlds.app` only at root cutover                        |

`pnpm build:ci` runs type checking, unit tests, the Worker build and artifact checks sequentially. Wrangler's selected name must match the Cloudflare Worker application. The dev Worker's “production branch” label means `npc-sheets` deploys to dev; it does not authorize deployment to root. Root's named environment is explicitly selected in its deploy command. No branch is created or renamed by this plan.

Execution order matters because creating/connecting the Worker can start an initial build immediately:

1. Snapshot the current Pages Git settings and deployments. Before pushing candidate source, explicitly authorize pausing **this Pages project's** automatic deployments: `production_deployments_enabled = false` and `preview_deployment_setting = none`. Keep `main`, domain attachments, existing deployments and DNS intact at this point. This leaves the current sites serving their existing releases and prevents a source push from unintentionally replacing root or building Worker output through Pages. Do not revoke/uninstall the shared GitHub App.
2. The owner reviews/commits/pushes the candidate with separate exact Git authorization. The remote `npc-sheets` must contain `wrangler.jsonc`, the pinned Wrangler dependency and `build:ci` before connecting the new build. The current remote branch still holds the historical release; connecting it now could trigger a build of the wrong source. No push has been made in this task.
3. After explicit Worker-creation/deployment authorization, create/connect **brighter-worlds-dev** to the existing Git repository with the table's settings. Disable preview branches and inspect the initial build's branch/SHA, package-manager installation and command output. Empty routes keep it unrouted. Record build/version IDs, verify bindings/props and retain the compatible recovery checkpoint before switching the dev domain. If repository selection requires new GitHub access, have the owner grant only this repository; do not silently broaden an installation.
4. Complete the domain cutover below, keeping that Custom Domain in checked-in dev configuration for future Git deployments. Further pushes to `npc-sheets` then rebuild/deploy only the dev Worker. Do not trigger a manual build or push solely to test the integration without its deployment authorization.
5. Configure the root connection only after dev validation and reviewed source is available on `main`. Verify its command uses `--env production` before enabling builds. Preserve root's old release until its own cutover.
6. Retire the Pages project only after root and dev are served by verified Workers, recovery/deep links and historical Pages-origin export access have been considered, and a separately explicit deletion request is given. Retaining it during validation preserves the original checkpoints. Deleting it now would remove the currently serving root application.

The API's repository-autofill read succeeds with `branch=npc-sheets`: it detects pnpm and only a build script, with no Wrangler config or Worker name on that remote branch. An initial request omitted the required branch and returned 400; this was corrected. Current Pages repository/branch/auto-deploy settings were also read successfully. The prepared settings above are concrete setup values, not a claim that a Worker/build trigger has been created or connected.

## Prepared dev cutover

Use a Worker **Custom Domain** because the Worker will serve the whole application. Cloudflare recommends this for Worker origins, while Worker Routes wrap an existing origin. A Custom Domain covers all paths and queries at the existing hostname, so the browser origin and stored data stay the same. Cloudflare cannot create it while the hostname still has an existing CNAME. See [Custom Domains](https://developers.cloudflare.com/workers/configuration/routing/custom-domains/) and the [Pages migration guide](https://developers.cloudflare.com/workers/static-assets/migration-guides/migrate-from-pages/).

After an explicit request to deploy the dev Worker, and after the prerequisites above:

1. Use the Git integration sequence above to build/deploy the reviewed candidate with empty routes. The explicitly authorized manual equivalent is `pnpm exec wrangler deploy --config wrangler.jsonc`; it is an alternative initialization/recovery path, not the intended everyday workflow. Record returned Worker/version/deployment IDs and verify deployed `AUTH`, `STORE` and their trusted props. No domain is attached at this step; workers.dev and public previews stay disabled. Stop if scope/entrypoints differ.
2. Before switching traffic, retain the original Pages project/deployments and establish a compatible recovery artifact. Agree the brief domain/DNS transition window and rollback checkpoints. Do not delete Pages or modify root/www.
3. Remove **only** `dev.brighterworlds.app` from the Pages project's Custom Domains. Read DNS again; if the original dev CNAME remains, remove **only that saved dev CNAME record**. At the recorded checkpoint it is record `26ab5dd96ae714b3da1ceb36d6c3b3ac`, target `npc-sheets.brighter-worlds.pages.dev`, proxied, TTL Auto. Re-read IDs before using them. Do not touch root, www, mail or unrelated records.
4. Add the following top-level route to `wrangler.jsonc`, leaving `env.production.routes` empty, and repeat `pnpm check:worker` and the dev dry run before an authorized deployment. Cloudflare provisions the Worker DNS/certificate. Capture the new domain/DNS/version metadata and verify HTTPS readiness rather than claiming the switch succeeded from a CLI exit alone.

```json
"routes": [
  { "pattern": "dev.brighterworlds.app", "custom_domain": true }
]
```

5. Deploy that reviewed dev configuration. Verify the dev hostname serves the candidate's exact assets and dynamic routes without an origin redirect. Verify root still serves its old recorded release. Test `/`, `/migrate`, `/character`, `/character/hero_01`, account-query deep links and auth completion query cleanup. Check `no-store`/`no-referrer` on auth/personal/dynamic responses, private-source paths never return server JavaScript, and the popup opener is not severed by effective headers.
6. Run the dev validation matrix below and record per-case evidence. Git build configuration, pausing Pages builds, source pushes and deployment remain distinct explicit changes described above; none has been executed by this preparation task.

This switches hosting, not browser data. Never clear localStorage/IndexedDB, bulk-upload local sheets, delete source copies or redirect the dev origin. A possible later redirect of dev `/` only is not part of this cutover.

## Fixture staging and matrix

`pnpm prepare:rollout-fixtures` writes seven **synthetic** files and SHA-256 `manifest.json` into ignored `private/rollout-fixtures`. It performs schema assertions for the portable inputs and never opens a browser, seeds storage, calls account services or uploads anything. Use new disposable browser profiles for each scenario. Keep real profiles and real account libraries out of this matrix.

| Fixture                      | Preparation / expected purpose                                                                                                                                                                                          |
| ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `legacy-root-storage.json`   | Raw localStorage key/value map for the original root format. Contains Mara (`hero_01`), Pip, a healthy orphan, corrupt JSON, a mismatched ID and a list-only record. This is a seeding map, not a portable import file. |
| `legacy-dev-storage.json`    | The equivalent historical dev-format map, targeting dev. Keep raw entry strings byte-for-byte for before/after comparison.                                                                                              |
| `linked-with-image.json`     | Valid portable Mara/Pip graph with a byte-exact embedded PNG; file/popup preservation and account-image rejection.                                                                                                      |
| `account-ready.json`         | Same linked graph with an image URL instead of bytes, suitable for explicitly authorized account tests. The intentionally invalid example hostname need not be fetched to save the URL.                                 |
| `divergent-copy.json`        | Same sheet IDs as account-ready, with a distinguishable destination note. Seed the destination first through normal file restore; expect both edits to survive a later conflicting transfer.                            |
| `reject-future-version.json` | Unsupported format version; reject before storage writes.                                                                                                                                                               |
| `reject-corrupt-image.json`  | Corrupted attachment bytes with original size/hash; reject before writes.                                                                                                                                               |

For legacy tests, seed only in the corresponding origin's disposable profile, before loading the candidate. Use the browser storage inspector to write the map's `entries` as the exact raw strings, or an explicitly authorized test harness. Confirm the profile has no user sheets first. Do not ordinary-import the map: that bypasses the legacy storage path. Keep a before snapshot, then open the candidate deep link/list and compare the raw source strings and all destination/recovery records after reload. For a mixed-store case, first import `divergent-copy.json` into IndexedDB, then seed the legacy map without changing that database. Never use `localStorage.clear()` or delete a real database as a test setup shortcut.

Record each case as **not run / pass / fail**, with candidate version, browser/version/profile, source/destination origin, fixture manifest hash, timestamps, per-record outcomes and before/after observations. Screenshots must not reveal auth codes, tokens, webhook values or real user data.

| Case                             | Procedure and pass condition                                                                                                                                                                                                                                                                                                                    | Automated local evidence                                                    | Live gate                   |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- | --------------------------- |
| Old-root-only                    | Open original deep link/list in the original profile; migration retains raw originals, zero/false/custom content and companion links. Reload does not replay over newer edits. Root fixture can be exercised on an authorized candidate test environment; changing live root is deferred.                                                       | `sheet-format/contract`, `sheet-recovery`, `sheet-loading`                  | Pending root candidate      |
| Dev legacy/mixed/corrupt         | Use the dev map and mixed-store recipe; healthy/orphan records proceed, current divergent IndexedDB content stays, damaged/list-only/mismatched rows show recovery and remain downloadable.                                                                                                                                                     | `sheet-recovery`, `sheet-loading`                                           | Pending dev                 |
| Direct URLs and reload           | Open character/companion URLs directly, including `?account=...` for account sheets; missing sheets never persist blank placeholders. Navigate/reload during migration; no duplicate/replayed records.                                                                                                                                          | `sheet-loading`, `sheet-manager`, `sheet-recovery`                          | Pending dev                 |
| Anonymous file route             | Export selected PCs/companions, import with preview in a fresh profile, compare content and byte-exact images. No sign-in or automatic upload. Invalid future/corrupt-image input writes nothing.                                                                                                                                               | `sheet-backup`, `sheet-format/contract`                                     | Pending dev                 |
| GM scope                         | In a disposable dev profile author a custom NPC/relic, encounter, playmat instance with modified stats, scene, table, friend and both logs. Download a game backup, restore into a second profile, check all nine categories and images. Existing categories stay unless replacement is explicitly selected; prior versions are archived.       | `sheet-backup` nine-category and replacement tests                          | Pending dev                 |
| Companion closure                | Inspect both sheets and every link; include cyclic/missing links. Portable/popup flows warn explicitly about unavailable companions. Account saving blocks unresolved companions and embedded bytes; no silent data dropping.                                                                                                                   | `sheet-backup`, `account-transfer`, `sheet-transfer/transfer`               | Pending dev                 |
| Account receipt and partial save | Explicitly save account-ready with a dedicated test account. Verify both documents before relying on root. Induce a controlled quota/network failure in the authorized test setup; inspect individual saved/unsaved outcomes, retry, and verify originals remain editable until the whole group is acknowledged. `exists` alone is not success. | `account-transfer`, `account-persistence`, `server/sheet-api`               | Pending account environment |
| Same-account concurrency         | Use two independent profiles/caches, edit the same account document, compare both copies, replace only the reviewed version. Account switching must not upload A's draft to B. Repeat on exact root/dev origins once both run the candidate.                                                                                                    | `account-persistence`, `account-transfer`                                   | Pending exact two origins   |
| Both-origin popup                | Root library already nonempty, dev has matching and divergent IDs. Source consent precedes payload transmission; root previews before saving. Keep-both remaps the whole graph; skip stays skipped. Verify every result and source retention. Retry after lost acknowledgment, later edits and deletion without overwriting or resurrecting.    | `sheet-transfer/transfer`, `sheet-backup`                                   | Pending exact two origins   |
| Popup failure                    | Block/close/navigate popup, sever opener, suspend/background, timeout during chunks/results. Recover via source file export or validated received backup. Repeat supported Chrome/Firefox/Safari; desktop first, basic mobile recovery too.                                                                                                     | `sheet-transfer/transfer` fake-window cases                                 | Pending browser matrix      |
| Auth/service failure             | Existing cookie plus unavailable Ankh/Aegis; `/migrate`, local sheets, file/private recovery stay reachable and account operations fail closed. Restore services and retry without losing drafts. Do not disable shared production services to create the test; use an authorized isolated fault setup or the recovery configuration.           | `server/transfer-access`, `server/ankh`, `account-persistence`              | Pending dev                 |
| Browser storage/quota failure    | In disposable test profiles deny browser storage or inject a controlled failed write. Verify no durable-save claim, rollback/no partial graph acknowledgment, intact originals, visible warnings and downloadable readable/in-memory data. Export open unsaved sheets before closing; restore access and reload.                                | `sheet-recovery`, `sheet-backup`, `private-recovery`, `account-persistence` | Pending browser matrix      |
| Cutover/rollback smoke           | Exact hostname, paths and queries unchanged; bindings/props correct; private/server files excluded; recovery artifact still reads all formats and exports; root untouched during dev stage.                                                                                                                                                     | Worker build guard and dry runs                                             | Pending deployed evidence   |

Root currently serves the old app and `/migrate` is 404. The complete root-initiated popup and same-account **two-origin candidate** checks cannot honestly pass during a dev-only rollout. Validate the dev source/export/account behavior first, then perform the exact two-origin checks as part of a separately authorized root candidate release. Do not weaken exact-origin checks or add an unregistered preview origin to manufacture a pass. Root replacement requires the dev sign-off plus an explicit plan for these remaining root checks.

## Compatible rollback

Save these checkpoints: pre-cutover Pages deployment IDs and DNS/domain metadata; reviewed candidate commit/diff and tree hashes; first working recovery-capable Worker version; current active Worker version; trusted bindings/props; active dev Custom Domain; fixture and test outcome evidence. Retain artifact/asset dependencies for the selected rollback version.

- **Before new application data has been written:** if the domain transition fails, restore the saved dev Pages attachment/CNAME after removing any conflicting Worker Custom Domain. Verify HTTPS/deep links and root's untouched state. Do not make assumptions about which control removed DNS automatically; inspect after each operation.
- **After any new local/account writes:** prefer rolling back to a verified compatible Worker version while preserving the dev Custom Domain. Do not just restore the historical `npc-sheets` Pages alias: old code may ignore account/recovery state or replay stale localStorage.
- **First Worker release with no prior compatible version:** deploy the prepared same-format recovery build/configuration after explicit authorization, preserving the dev Custom Domain. No AUTH/STORE means cloud operations are unavailable; local sheets, cached drafts and exports remain. Alternatively use an explicitly staged and verified compatible Pages recovery build, never the unverified old application. Record this checkpoint before general use.
- **Data recovery:** rollback does not roll back browser or cloud data. Keep originals, tombstones, receipts and archives; never automatically delete them, downgrade records, restore account versions wholesale or clear browser storage. Use per-sheet conflict/recovery flows and portable backups after inspection. Keep readable failed-write tabs open for export.

Any rollback deployment, DNS/domain mutation, Pages settings change or Git operation still needs its exact current authorization. A code rollback alone is not evidence of data safety.

## Handoff gates

- [x] Shared Worker source/configuration prepared; dev and future root identities separated.
- [x] Local checks, both build modes, asset/binding checks, fixture staging and Worker dry runs recorded in rollout-evidence.md.
- [x] Current read-only DNS/public HTTP observations recorded; unavailable live account metadata explicitly identified.
- [x] Updated token verifies account-level metadata, deployed Ankh origin registration and Ankh/Aegis exports. Git repository detection and remote source checkpoints verified.
- [ ] Consumer binding-property delivery and account RPC behavior verified on the deployed candidate.
- [ ] Explicit request to deploy dev and switch only its domain; candidate/version and compatible recovery checkpoint recorded.
- [ ] Dev live browser/account/fixture matrix and rollback smoke signed off.
- [ ] Separate root release authorization, root fixture verification and full two-origin matrix.
- [ ] Pages auto-build transition/retirement reviewed separately; retain recovery access and do not delete Pages during this task.
