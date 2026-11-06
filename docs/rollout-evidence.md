# Rollout preparation evidence — 6 November 2026

This is local preparation and a read-only hosting refresh. **No Worker was uploaded/deployed, no Pages/DNS/domain/binding setting changed, and no Git history operation occurred.** Live fixture seeding, account writes, authentication and two-origin popup testing have not been performed. The execution/runbook gates are in [dev-rollout.md](dev-rollout.md).

## Candidate identity

- Starting branch: `npc-sheets`.
- Starting HEAD: `dfb4986dafcc422da891c22a608336b30a76af59` (Migration path).
- Starting working tree: clean. The Worker/configuration/scripts/docs in this task remain an uncommitted candidate delta; the HEAD alone is not its release identity.
- Dependency lock SHA-256: `bb9e11bf8cdbd12c197957d285a71e8db4ece68c50bf09d5f7a53305c714ee7b`.
- Wrangler: pinned direct dev dependency `4.98.0`, matching the prior transitive version. The lock diff adds only that direct importer entry; no package versions were upgraded.

## Local results

| Check                             | Result                     | Scope / limits                                                                                                                                                                                                                                                                                                                                                                                 |
| --------------------------------- | -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm check`                      | Pass: 0 errors, 0 warnings | Svelte/TypeScript; final application/configuration state.                                                                                                                                                                                                                                                                                                                                      |
| `pnpm test:unit --run`            | Pass: 395 tests / 37 files | Includes legacy/mixed/corrupt storage, direct-link initialization, backups, all nine GM categories, companion graphs, root/dev access without account services, fake-window transfer failures/receipts, same-account independent caches, conflicts, partial saves, quota rollback and auth/storage failures. These are isolated automated fixtures/mocked services, not live browser evidence. |
| `pnpm build:pages`                | Pass                       | Explicit compatibility target.                                                                                                                                                                                                                                                                                                                                                                 |
| Worker guard against Pages output | Correctly fails            | `.assetsignore` is absent from Pages output; the Worker check refuses that artifact.                                                                                                                                                                                                                                                                                                           |
| `pnpm build`                      | Pass                       | New default Worker target, rebuilt after the compatibility check; no upload.                                                                                                                                                                                                                                                                                                                   |
| `pnpm check:worker`               | Pass                       | Dev/root identities, named services, exact trusted `bwo` props, Worker-first assets, domain separation, server-source exclusions and local tree fingerprints. Recovery target has no account service bindings.                                                                                                                                                                                 |
| Dev Worker dry run                | Pass                       | `brighter-worlds-dev`, AUTH/STORE/ASSETS/public Ankh URL; no domains or public previews. Compile-only, not live RPC verification.                                                                                                                                                                                                                                                              |
| Production Worker dry run         | Pass                       | Explicit `production` environment for later root; same AUTH/STORE/ASSETS contract; no domain attachment.                                                                                                                                                                                                                                                                                       |
| Recovery Worker dry run           | Pass                       | Same dev Worker identity; only ASSETS/public Ankh URL, no AUTH/STORE. Same compatible code, cloud operations unavailable. No recovery deployment.                                                                                                                                                                                                                                              |
| `pnpm prepare:rollout-fixtures`   | Pass                       | Seven synthetic files plus a SHA-256 manifest in ignored `private/rollout-fixtures`; no browser/account writes. Supported bundles pass schema checks and the future-version input is deliberately rejected.                                                                                                                                                                                    |

Wrangler dry runs report about **2,850.90 KiB / 521.57 KiB gzip** for the bundled Worker and finish with `--dry-run: exiting now`. Existing `idb-keyval` bare-import/side-effect bundler warnings occur; they do not prevent compilation. Do not confuse the CLI's “Total Upload” size estimate with an executed upload. Public personal/auth response headers, trusted-property delivery and browser quota/opener behavior still need deployed validation.

Fingerprints from the final local Worker build (recompute at release; these are not deployed version IDs):

| Artifact                                       | Files           | SHA-256                                                            |
| ---------------------------------------------- | --------------- | ------------------------------------------------------------------ |
| `.svelte-kit/cloudflare/_worker.js` entrypoint | 1 (4,335 bytes) | `cf4056f946ba2822fb93035da445ea2b74c918e9bbbb7d646dffcc8db657d484` |
| `.svelte-kit/output/server` tree               | 180             | `e03160becd5163628e07362260c2f4c2e7e467e1b2369c6a907fee3601b03e09` |
| `.svelte-kit/cloudflare` asset/entrypoint tree | 128             | `ce9b6280e2563b4df58a51085d36dfcd58eaefb4fca5fb41027bd069a6b4ff6e` |

The tree digests include sorted relative paths, byte lengths and exact file bytes. The small entrypoint imports the server build; its hash alone cannot identify all runtime code. `check:worker` therefore records both trees.

## Read-only live refresh

Ordinary unauthenticated GET requests and existing read credentials were used around **21:18–21:25 UTC on 6 November**. No browser storage, real sheets, database rows or session cookie was read or sent. Credential values are excluded from this report.

| Observation                                         | Refreshed result                                                                                                                                                                                                                                       |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Root DNS                                            | Proxied CNAME `brighterworlds.app → brighter-worlds.pages.dev`, TTL Auto; record `cc259401980d1d160bfc000273491517`.                                                                                                                                   |
| Dev DNS                                             | Proxied CNAME `dev.brighterworlds.app → npc-sheets.brighter-worlds.pages.dev`, TTL Auto; record `26ab5dd96ae714b3da1ceb36d6c3b3ac`.                                                                                                                    |
| www DNS                                             | Proxied CNAME to `brighter-worlds.pages.dev`; existing active www-to-root 301 Page Rule `1199ff6c2ff1f1785015212426b6b836` remains.                                                                                                                    |
| Zone rule inventory                                 | Reads succeeded; returned managed rulesets, with no custom dev-to-root redirect observed. This does not establish account-level Worker routing.                                                                                                        |
| Root/dev `/`                                        | HTTP 200 at the same requested URL. Root has older app markup; dev still references `start.D8LzoEH7.js` / `app.Ch4Lyoyk.js`.                                                                                                                           |
| Root/dev `/migrate`                                 | HTTP 404 at the same URL. The candidate recovery/transfer route is not live.                                                                                                                                                                           |
| Root/dev `/character/rollout_fixture?check=rollout` | HTTP 200; path and harmless query retained. This verifies an HTTP shell response, not persisted-sheet loading or browser behavior. No auth flow was initiated.                                                                                         |
| Headers on inspected 200 responses                  | No explicit Cache-Control, CSP, COOP, COEP or Referrer-Policy observed. Candidate dynamic response headers and effective opener behavior remain pending.                                                                                               |
| Account/Pages/Worker metadata                       | Account list 403; Pages project and Worker script metadata 401 with the existing Wrangler OAuth credential. Service metadata/route refresh also encountered 401/429; no successful current binding or route inventory. No repeated rate-limit retries. |
| Wrangler read-only identity check                   | Failed with an authentication error and advised login. A fresh Cloudflare login/access check is needed before a live rollout. No interactive login or permission grant was initiated.                                                                  |

These initial credential failures were superseded by the successful token refresh below. No interactive login was needed. Live consumer RPC, trusted-property delivery and account/browser behavior still require deployed validation.

## Successful token and Git integration refresh

At approximately **21:33–21:35 UTC**, the owner renamed/updated the audit credential to `X_CF_API_TOKEN`. Explicit read-only requests using that token succeeded without changing Wrangler's stored login or exposing credential values.

- Account: `d9c1c6fe41907455f2a1709de422b29d`. Pages **brighter-worlds** still owns root/dev; build command `npm run build`, output `.svelte-kit/cloudflare`, production branch `main`. Production automatic deployments are enabled; preview policy is `all`, includes `*`, with no exclusions. No AUTH/STORE service bindings appear in Pages production/preview settings.
- Pages production checkpoint remains `69560c5f-7d12-46d1-a6ce-9d36f807ebba` at `f83b14b985a705e2fc05c4408818704c9aadbfe8`; latest preview remains `56e2f876-048e-4d40-a597-cedf322d1dad` at `13d6ece542b9458b96341a739cf26b5d558e7103` (`npc-sheets`). Both successful deployment stages were read.
- Worker script inventory succeeds: `ankh` and `aegis` exist; neither `brighter-worlds-dev` nor `brighter-worlds` is present in the returned inventory. Zone Worker routes return an empty list. DNS targets and the existing www rule are unchanged.
- Deployed Ankh content read succeeds. It exports `AuthService`, uses context props, and its `bwo` registration includes exact root, dev and `http://bwo.localhost` origins. Source SHA-256: `22ae16149ec4d36ec9e7635dee2ede79715be998728be46ab83b82259caf6ae0`.
- Deployed Aegis content read succeeds. It exports `Aegis` (and the unused administrative `AegisMigration`), uses context props, and contains the allowed-app guard. Live settings have no `ALLOWED_APP_IDS` override binding. Source SHA-256: `2461fa3aa70fbde1ed89dc1ca2b779976453c3a49ca3d924032598897af49cd4`. This task configures only `Aegis`, never the administrative migration entrypoint. Source inspection does not execute an RPC or prove consumer binding delivery.
- `git ls-remote` confirms remote `main` and `npc-sheets` still point to the historical SHAs above. The local candidate is not on GitHub yet. Workers Builds repository detection with the required `branch=npc-sheets` parameter succeeds: package manager `pnpm`, no Wrangler config/Worker name, only a `build` script detected. The initial parameterless request returned 400; it was a missing-branch request, not a permission failure. No repository connection or build was created.
- `pnpm build:ci`, the exact proposed Git build command, passes sequentially: type check 0 errors/warnings, 395 tests/37 files, Worker build and artifact guard. The final server/asset fingerprints below supersede those from the earlier local build.
- The already-running local server returns 200 and `Cache-Control: no-store` on `/`, `/migrate`, `/character`, `/account` and `/api/session`; migration HTML includes the ttrpg.tools account heading. This was an unauthenticated HTTP smoke check; no new server or browser/account test was started.

Final Git-build candidate fingerprints:

| Artifact              | Files | SHA-256                                                            |
| --------------------- | ----- | ------------------------------------------------------------------ |
| Server tree           | 180   | `454771d8245e20e641ecca0ebb92bd8b8a121de40834079052c51ef5a69e9074` |
| Asset/entrypoint tree | 128   | `5ff6800504a4020c0ee26a4e2374962e5ccadce3624b9391f98b78bcb21f7613` |

The Git setup values and the safe order for pausing Pages auto-builds, making the reviewed source available, creating the Worker build connection and switching only dev are in [dev-rollout.md](dev-rollout.md). Deleting the existing Pages project now would remove the currently serving root application; retirement remains a later explicit action after both domains and recovery are validated.

## Remaining live evidence

Every live row in the [fixture/browser matrix](dev-rollout.md) remains pending. Dev may be moved only after the credentials/service/candidate/recovery prerequisites and an explicit deployment/domain-cutover request. Keep root's current release unchanged during dev validation. Root's old app cannot initiate the new exact-origin popup; the full two-origin candidate checks belong to the separately authorized root release stage. No new origin, wildcard bridge or unapproved production data mutation was used to bypass that constraint.
