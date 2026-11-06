# Brighter Worlds integration and migration plan

Audit date: 5 November 2026. Updated with the owner’s follow-up decisions and read-only hosting inventory. This is a source audit and implementation plan; it does not change the application, branches, infrastructure, or live data.

## Recommendation

Continue development from `npc-sheets`. Make browser storage migration safe, add optional ttrpg.tools account saving through Ankh and Aegis, and make that functionality available on the existing dev origin before replacing the root application. Keep `https://dev.brighterworlds.app` serving a compatible application with local sheet access, account saving, and export for the foreseeable future. Do not redirect that entire origin to the root. Redirecting only the dev landing page `/` is a later option once its dedicated transfer route and all sheet deep links remain reachable.

Use one Brighter Worlds account library for both origins: Ankh/Aegis application ID `bwo`, with a proposed `pc` collection. Each origin retains its own browser storage and host-local authentication cookie. Signing into an account does not upload local sheets automatically.

Treat Parallax as a subsequent integration with three explicit storage choices: browser-local, account-backed, and Parallax world-backed. World-backed sheets must work for players without a Brighter Worlds account. Account saving is a convenient migration route, not a prerequisite for world-backed play.

## Evidence and limits

- Working checkout: `/Users/colinbate/Projects/brighter-worlds`, clean on `npc-sheets` at `13d6ece` at the beginning of this audit.
- Local `main` and its remote-tracking ref point to `f83b14b`. Local `npc-sheets` and its remote-tracking ref point to `13d6ece`. Common ancestor: `7e6e45a`.
- `git rev-list --left-right --count main...npc-sheets`: **1 main-only commit, 83 npc-sheets-only commits**. The branch delta is 252 files, 14,824 insertions and 9,861 deletions; much is framework conversion and formatting.
- Remote-tracking `simple-play` has four unique commits, while `npc-sheets` has 17 relative to it. It is an older experiment, last recorded 7 September 2025. Its unique changes include a standalone `/play` route, a bus, and sheet/GM integration. The owner has approved retiring these experimental transport/gameplay features; do not bring them forward solely to consolidate branches.
- Remote-tracking `tech-stack-file` has four unique documentation commits, last recorded 4 January 2024. It is not an integration prerequisite.
- Follow-up: read-only `git ls-remote` and the live GitHub branch API verified these exact refs. Cloudflare Pages and public HTTP checks now establish the deployment checkpoints in [hosting-inventory.md](hosting-inventory.md); DNS confirms root → production Pages hostname, dev → npc-sheets preview alias, and www → production with a legacy 301 to root; no custom redirect/Origin Rule rulesets exist.
- Follow-up: both root and dev returned 200 to direct public GET requests. The existing Cloudflare Pages project and deployment metadata were inspected read-only. No live browser storage or production database contents were inspected.
- Sibling source references: `/Users/colinbate/Projects/keepers-call`, `/Users/colinbate/Projects/ankh`, `/Users/colinbate/Projects/aegis`, and `/Users/colinbate/Projects/parallax`. Local source/configuration is not proof of deployed service versions.

## Current application

The active app already uses Svelte 5, SvelteKit 2, Tailwind 4 and the Cloudflare adapter. It has a character creation wizard, editable PC and companion sheets, inventory, magic, damage, statuses, epitaph/XP entries, notes, JSON import/export, Discord rolls, and browser broadcast support. GM features include bestiary/NPC sheets, encounters, a playmat, scenes, custom roll tables, travel/friends tools and player logs. At audit time, Miro/PeerJS and Narrator messaging also existed; their retirement is now implemented (see [retired-play.md](retired-play.md)). The owner has approved retiring the Miro map, unreliable PeerJS mesh, Narrator feed/bridge and their UI. Retain Discord functionality and native sheet/GM tools. Generic cross-tab persistence and sheet selection currently share browser messaging helpers with the old gameplay transport, so remove only obsolete paths after checking their callers. The new migration popup must use its own bounded protocol, not the old wildcard bridge.

There is no Ankh/Aegis integration in this checkout: no auth middleware, account routes, cloud character API or checked-in Wrangler service-binding configuration. `svelte.config.js` selects the Cloudflare adapter; actual hosting configuration must be inventoried.

| Data                                | Current persistence                                                  | Portability consideration                                                    |
| ----------------------------------- | -------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| Root app sheets at `main`           | localStorage `bw-sheet-list` and `bw-sheet-{id}`                     | Must migrate in place on the root origin, including direct sheet URLs.       |
| Active branch sheets                | IndexedDB via default `idb-keyval` store, `bw-sheet-{id}`            | Preserve IDs and read existing records without destructive reinitialization. |
| Sheet list on active branch         | Rebuilt from IndexedDB; live list uses broadcast/context             | Recover orphan records and avoid matching metadata keys as sheets.           |
| Encounters, playmat, scenes, tables | `bw-encounters`, `bw-playmat`, `bw-gm-scenes`, `bw-gm-tables`        | Provide backup/restore even if only PCs get account saving initially.        |
| Friends and logs                    | `bw-gm-friends`, `bw-rolllog2`, `bw-player-log`, `bw-current-gameid` | Keep dev access; define supported export scope and log retention.            |
| Preferences                         | IndexedDB settings/UI keys; localStorage dark mode                   | Separate preferences from game data and portable account data.               |

Source entry points: `src/lib/data/sheet-manager.ts`, `idb-store.ts`, `storage.ts`, `persisted-collection.svelte.ts`, `encounter-manager.ts`, `settings.ts`; `src/routes/character`; `src/routes/gm`; `src/lib/types.ts`.

The v1 document/bundle and storage identity contract is defined in [sheet-format.md](sheet-format.md), with TypeScript types, JSON Schemas and executable compatibility fixtures under `src/lib/data/sheet-format`. The [migration recovery](storage-recovery.md) and [portable backup/restore](backups.md) implementations now use this contract; live runtime keys remain compatible with the current app. Account integration is still pending.

## Migration findings

1. **Deletion before durable write.** `tryMigrate()` calls `clear(bw-sheet-{id})` before `sheet.set(char)` completes. A failed or unavailable IndexedDB write can destroy the original. The fallback store does not persist to disk, so a fulfilled store operation alone is insufficient proof of durable migration.
2. **Mixed-store overwrite.** Migration unconditionally writes legacy sheets over matching IndexedDB IDs. A safer converter must compare existing destinations, preserve divergent versions, and resume after interruption without resetting newer data.
3. **Fragile legacy decoding.** A malformed JSON entry can abort the migration. Read the storage key as well as the value; reconcile missing/mismatched IDs and list-only/orphan records rather than silently dropping them.
4. **Error handling and lifecycle.** `loadList()` and direct sheet loading invoke migration without a recovery UI. Direct loading also initializes a sheet store before migration. Serialize migration/initialization, await persistence, surface failures, and prevent multiple tabs from racing migration.
5. **Export/import gaps.** Current export is a single unversioned JSON sheet. Import performs minimal field checks, fails quietly, discards the incoming ID and creates a new one. It has no bundle identity/remapping strategy or reliable success reporting. `downloadSheet()` also performs an identity update before export; recovery export should not require a successful storage write.
6. **Linked companions.** `wizard.svelte.ts` creates a separate companion sheet and embeds its relative `/character/{id}` link in ability HTML. Moving only a parent can leave a dangling link. New exports should carry a manifest and structured relations, preserve IDs where safe, and remap all references when duplicating. Existing HTML links need a compatibility reader.
7. **Serialization.** Runtime characters include `Set` statuses and may contain `Blob` images; the empty marker is a symbol. Define a JSON-safe versioned format, explicit status conversion, image handling and runtime-marker exclusion. Preserve unknown legacy fields and custom content through supported migrations. Keep `eulogy` as a compatibility field even though UI terminology changed to epitaph.
8. **Private settings.** A sheet can contain a Discord webhook in `settings`. Treat that as sensitive local configuration. Portable/cloud payloads must use an allowlist and exclude webhook secrets, session credentials and local-only preferences. Warn before any optional sensitive-settings backup.

The converter should snapshot raw source records without altering them, validate/normalize per record, commit to IndexedDB, read back/verify, and journal success. Retain originals in a recovery archive outside the active legacy namespace. Never delete the sole recoverable copy. Failed records remain visible and downloadable while valid records proceed. A journal must avoid repeated reimports or resurrecting intentionally deleted sheets.

## Origin migration strategy

The shared Worker build migration and a dev-first hosting/cutover, fixture-validation and compatible rollback runbook are now prepared in [dev-rollout.md](dev-rollout.md). Current local and read-only live observations are in [rollout-evidence.md](rollout-evidence.md). Deployment, refreshed deployed-service verification and the live browser gates remain outstanding; root is held until dev validation.

The implemented home/library callouts, `/migrate` guide and origin-specific no-loss routes are documented in [migration-guidance.md](migration-guidance.md). They retain both origins and all recovery/deep-link routes without a hosting or redirect change.

LocalStorage and IndexedDB are scoped to an origin. Loading new code at `brighterworlds.app` can read that origin's old storage; it cannot read `dev.brighterworlds.app` storage. A redirect changes the executing origin and cannot move the data. See [MDN Web Storage](https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API) and [MDN IndexedDB](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API).

Support three first-class routes, with the direct popup copy providing the primary same-browser experience:

- **Direct popup route:** root opens a dedicated dev migration page in a user-initiated popup. The source lists compact character/companion summaries; the user selects records to copy. A versioned exact-origin `postMessage` protocol transfers only selected validated bundles. Root confirms durable saves before reporting success. Keep source copies, handle duplicates/divergent edits explicitly, and offer file export if popups/opener access fail. This route requires no account. See the detailed protocol below.
- **Account route:** visit the old origin in the original browser/profile, choose sheets to save to the ttrpg.tools account, verify successful cloud receipt and linked companion coverage, then open the root and sign into that same account. Keep local recovery copies. A duplicate ID is not success until the cloud payload or migration receipt is verified; divergent copies require a choice.
- **File route:** export a versioned bundle from the old origin and import it at the root without creating an account. Preview affected characters/companions, validate all data, report per-record outcomes and allow retry. Preserve or remap IDs consistently across the entire bundle. Offer backup of GM data too.

The root should explain that dev-origin sheets require opening the dev site in the browser/profile that holds them. Never imply a server can discover every browser's records. Keep dev deep links working, and keep migration/export reachable during auth or storage-service outages. Users with both origins open must get cloud version conflicts rather than last-write-wins data loss.

Prefer both origins serving the same compatible release once validated, with root canonical for documentation/new links and a clear dev migration notice. A smaller recovery application is a possible later maintenance choice only after it proves all historical formats and exports. Continued hosting cannot recover data already removed by browser clearing, eviction, or a lost device. No fixed shutdown deadline is recommended.

Rollback must not simply reinstall the old localStorage-writing app over newer root data. Retain format compatibility, recovery archives and release checkpoints; prepare a recovery-capable rollback that does not re-run stale legacy migration over updated IndexedDB/cloud sheets.

## Direct popup transfer protocol

Implemented in the current checkout; see [account-free sheet transfer](sheet-transfer.md) for the UI, protocol, durable receipts, fallback, and outstanding browser release checks. Hosting and the separate dev landing-page redirect remain unchanged.

The root character list should offer a user-initiated **Find sheets from the old site** action whether the list is empty or already has local sheets. Do not assume an empty list is the only sign of missing dev-origin data. The dedicated dev route presents a compact selection view and an account-free copy action, with linked companions included or clearly identified.

- Open the fixed dev route from the click handler with a fresh random session identifier, proposed in the fragment. Do not put character payloads, auth credentials or webhook settings in URLs. Both origins are configured constants, never a caller-supplied return origin.
- Every message validates exact `event.origin`, expected window identity (`window.opener`/the returned popup), protocol version, current session, operation and schema/bounds. Send to an exact `targetOrigin`; never `*`. Reject expired sessions, unsolicited payloads and messages after a window navigates or the session ends.
- Use an explicit handshake and source-side selection/confirmation before sending character data. Version the inventory/request/bundle/result operations. Bound inventory and payload sizes, and batch large bundles with progress feedback.
- Root previews collisions and validates the complete selected bundle before applying the chosen import policy. Preserve both sides when IDs diverge; remap parent/companion relationships together when copying. Import uses the same validated durable importer as file restore.
- Persist a content-bound transfer receipt at the destination. A lost acknowledgment and retry must not create duplicates or overwrite later edits. A receipt identifies the source/session/selection and actual destination IDs; an existing matching ID alone is not proof of completion.
- Send per-record success only after durable writes and required linked records succeed. A failed/partial import remains retryable, source data is never automatically deleted, and the UI does not call an unsaved transfer complete.
- Keep no-account file export/import available when a popup is blocked, closed, loses its opener because of COOP/noopener, times out, or cannot access the source storage. Validate desktop/mobile and supported browsers before recommending any landing-page redirect.

This is conventional cross-origin messaging, not a revival of the PeerJS/Narrator transport. Browser constraints are described in [MDN postMessage](https://developer.mozilla.org/en-US/docs/Web/API/Window/postMessage), [window.open](https://developer.mozilla.org/en-US/docs/Web/API/Window/open), and [COOP](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Cross-Origin-Opener-Policy).

## Ankh and Aegis integration

Ankh’s `src/apps.ts` now registers `bwo` with `https://brighterworlds.app`, `https://dev.brighterworlds.app` and `http://bwo.localhost`, following sibling-repository commit `0e53c5b` after the original audit. Verify this registration has reached the deployed service. Verify any real `www`, historical host, or HTTP redirects before deciding whether an additional recovery origin is needed. Do not create a separate app ID for root and dev: that would split account libraries.

Follow the implemented Keeper's Call consumer, especially `src/lib/server/ankh.ts`, `hooks.server.ts`, auth routes, `src/lib/server/aegis.ts`, character API routes, `character-manager.svelte.ts`, `persist.ts`, `cloud.ts`, and save-status/conflict components. Ankh's current integration contracts are available in its private folder: `private/CONSUMER_INTEGRATION.md` and `private/APPLICATION_ACCESS.md`. The server foundation now follows those contracts; see [account-services.md](account-services.md) for implemented endpoints, optional local use and hosting gates. The account library, explicit saving, graph transfers and sync/conflict UI are implemented in [account-persistence.md](account-persistence.md), pending review.

- Configure server-only Cloudflare bindings: `AUTH` to Ankh `AuthService` and `STORE` to Aegis `Aegis`, each with trusted `props.appId = "bwo"`. Add `STORE_MIGRATION` to `AegisMigration` only if bulk create is used. Confirm deployed entrypoints and any Aegis app allowlist first.
- Keep Ankh's host-local session cookie, ticket/completion-code login, return-origin validation, cookie rotation, logout and application-access decisions. Do not share a parent-domain cookie or put session tokens into URLs. Local editing/export must remain usable without an account and when Ankh is unavailable; do not blindly copy Keeper's Call's whole-app availability gate.
- Aegis keys records by `(userId, appId, collection, docId)`. Derive `userId` from verified server auth, never request JSON. Propose `bwo/pc/{id}` and document the chosen immutable namespace. PC companions use the same collection; NPC definitions and encounter instances remain distinct concepts.
- Define list/get/create/versioned update/versioned delete APIs, validate bounds and payloads server-side, paginate list results, and handle exists/not-found/conflict/quota outcomes. Preserve create-only semantics for first migration. Bulk create returns per-record receipts, with bounded batches and retryable partial progress.
- Use IndexedDB as local durability and offline cache, with metadata outside the `bw-sheet-` scan namespace: source, owner account, cloud document/version, dirty state, sync/error/conflict state and migration provenance. Existing records default to local. Sign-in does not silently promote them.
- Serialize saves per document; retain edits made while a request is in flight and reject stale responses after sign-out/account change. Show local, saving, saved, unsynced, conflict and error states. Retain recoverable edits on quota/network/auth failure. Before navigation or origin migration, wait for confirmed saves or offer export.
- Match Keeper's Call's conflict UX: compare remote/local copies, reload only after protecting local edits, save a duplicate, or explicitly replace using the freshly confirmed version. Never blindly retry a conflict with the newest version.
- Account switching must isolate cached ownership and never upload account A's edits to B. Distinguish removing a local cache from deleting the account document; cloud deletion is versioned. Define safe recovery for edits to a document deleted elsewhere.
- Aegis already provides versioned operations and atomic per-app/user quotas. Start with those limits and explicit feedback; do not copy Keeper's Call product-specific character limits or permission names without a Brighter Worlds decision.

For MVP, account saving covers PCs and companions. Full game-data export/recovery covers the broader dev app. Account-backed GM libraries, NPCs, encounters, images and cross-app campaigns are follow-on scope. Handle existing Blob images explicitly in MVP exports; never silently turn them into empty objects.

## Consolidation and release gates

The only `main`-only commit is `f83b14b`, "Add tracking". Its seven paths overlap framework changes, and `wizard.ts` became `wizard.svelte.ts`. `track.ts` and `.gitignore` are already identical between tips; active code already tracks wizard completion and character opening. Reconcile the intent/event names and typings in the current architecture rather than restoring old components. No conflict-free merge has been demonstrated, and no merge/index/branch operation was performed.

1. Verify remote refs, deployed commits, hosting projects/routes, redirects, service bindings, cache headers and all historical origins. Record the actual root/dev mapping and rollback checkpoints.
2. Agree the portable contract and fix migration/storage failure recovery. Add legacy/mixed/corrupt fixtures, including companion links and custom content.
3. Implement validated export/import and the optional Ankh/Aegis library on the active app. Restore the type-check baseline and run the appropriate unit, integration and browser checks.
4. Prepare a dev-first rollout, then obtain explicit authorization for its Git/infrastructure/release actions. Validate the actual dev application with seeded recovery fixtures, account saving and unauthenticated exports. Leave existing local data intact.
5. Verify root-old-format fixtures against the candidate release, both origins against the same account, conflicting edits, direct URLs, companions, GM backups, auth outage, quota failures and interrupted migration. Agree release/rollback evidence.
6. Prepare consolidation into `main`, preserving the newer application and useful main-only behavior. Obtain explicit authorization before performing a merge or deployment. Root release follows successful dev validation; keep dev serving recovery functionality.
7. After root rollout, check both origins and retain the migration path indefinitely unless a later explicit decision changes that policy. Anonymous browser data means analytics cannot prove that everyone has migrated.

Merging code and changing production routing are separate gates. Queue tasks prepare code and reviewable runbooks; they do not authorize Git history operations, hosting changes, or deployment.

## Parallax follow-on plan

Parallax currently registers only Keeper's Call in `apps/vtt/src/lib/sheet-providers.ts`. Its shared `@ttrpg-tools/sheet-bridge` implements `parallax-sheet` version 2, separate from its package version. Keeper's Call pins package `0.2.0`; verify registry availability and compatibility when implementation begins. Do not assume its version from older prose or require a new transport library.

1. **Define Brighter Worlds provider and embed routes.** Choose one stable provider ID (proposed `brighter-worlds`) distinct from auth's `bwo`, canonical root origin, exact allowed host origins, character/entity paths, world-document route and approved artwork origins. Add explicit registry/CSP handling and regression checks for Keeper's Call. A local-only URL is not a cross-device linked sheet; use a cloud document or explicit world import.
2. **Implement world-document sheets.** Use the shared package with `documents-v1` and `lifecycle-v1`, exact source/origin/nonce/capability/document checks, expected revisions, scoped local recovery and flush-before-replacement. When a document context is present, load/save only the world document, never a coincidentally matching local/cloud sheet. Reuse Keeper's Call's `world-document.ts` and recovery UX concepts; keep game rules native to Brighter Worlds. Include creation, empty documents, reload/reconnect, revoked control and simultaneous editors.
3. **Add display/roll/item/status integration.** Publish name/artwork metadata, native rolls through `rolls-v2`, item/magic cards and bounded status snapshots. Map Brighter Worlds dice, impairment/enhancement, saves, grit/damage and magic outcomes deliberately; do not substitute Keeper's Call rules. Contextual actions require durable deduplication stored with the changed native state and explicit capability support.
4. **Add account-linked sheets as a separate path.** Reuse `/ankh-auth` and app-local popup/grant/redeem/renew endpoints when iframe cookies are blocked. Credentials stay in memory and go only to the source API; Parallax does not inherit a user's Brighter Worlds identity. Guest world sheets remain account-free. Define explicit copy/import/export between account and world storage, including companion documents and relation remapping; avoid implicit bidirectional mirroring.
5. **Scope GM integration later.** Parallax's independent `parallax-system` v1 transport supports NPC libraries, encounters and roll-table imports. Brighter Worlds has reusable NPC stats, encounter membership and playmat instances with mutable grit/attributes/status. Define native definition vs combatant identity, per-token independent state, world/scene mapping, durable creation/action receipts and recovery before advertising these capabilities. Campaign linking is optional and not required for the initial PC integration.

Relevant Parallax references: `docs/sheet-protocol.md`, `sheet-bridge.md`, `sheet-providers.md`, `player-characters.md`, `embed-authentication.md`, `system-adapters.md`, plus `packages/sheet-bridge`. Keeper's Call references: `src/lib/bridge/parallax-sheet.ts`, `embed-auth.ts`, `src/lib/keepers-call/world-document.ts`, and native world-document recovery components.

## Validation recorded during this audit

- `pnpm test:unit --run`: **5 files / 15 tests passed**. Existing sheet-manager tests mock persistence and cover summary refresh; they do not establish safe legacy migration or cross-origin/account behavior.
- `pnpm check`: **1 existing error**, `src/routes/play/log/+page.svelte:80`, accessing `formula` on union `Cta` without narrowing away `AddToMatCta`; no warnings.
- `pnpm build`: Vite compiled client/server output, but the command **failed** when Cloudflare tooling attempted a loopback listener (`listen EPERM 127.0.0.1`) in this sandbox. This is not a successful production build. Recheck in an allowed environment; no dev server was launched and no deployment was attempted.
- Svelte autofixer on `persisted-collection.svelte.ts`: no reported issues; advisory effect-call suggestions concern snapshot/persistence calls. No application source was changed.
- No live browser migration or auth flow was tested. Browser validation requires a separately authorized test server or appropriate existing test environment.

## Decisions for implementation review

Confirmed direction: keep brighterworlds.app canonical unless a concrete hosting constraint emerges, retain dev/deep-link recovery, make account saving opt-in, use one `bwo` library, add an account-free popup copy flow, preserve Discord, retire Miro/PeerJS/Narrator, and defer all Parallax implementation until origin/storage/account consolidation is ready. PCs/companions first, broad file backup and world documents first for eventual Parallax remain recommended defaults. Confirm the exact dev maintenance policy, product-specific account limits, image scope, GM backup coverage and companion behavior inside Parallax before implementing their UI. These do not prevent beginning migration safety work.

Mux tracks the implementation breakdown and real prerequisites in the **TTRPG → Brighter Worlds** project. The audit/planning task is handed back for review; future implementation and rollout preparation remain queued.

## Mux task index

Project ID: `01M6PG92ABGQAX78DVDC3AKNEM`. Each stable key can be passed to `mux task show`; all agent writes identify `--actor agent:codex`.

| Task                                                                 | Stable Mux key                    | Prerequisites                                        |
| -------------------------------------------------------------------- | --------------------------------- | ---------------------------------------------------- |
| Review the Brighter Worlds integration audit                         | `bwo-integration-audit`           | None                                                 |
| Verify remote refs and root/dev hosting configuration                | `bwo-integration-hosting`         | None                                                 |
| Define a versioned sheet format and storage identities               | `bwo-integration-contract`        | None                                                 |
| Make localStorage to IndexedDB migration recoverable                 | `bwo-integration-storage`         | `contract`                                           |
| Add validated portable backups and linked-sheet restore              | `bwo-integration-backup`          | `contract`                                           |
| Retire Miro, PeerJS and Narrator while retaining Discord             | `bwo-integration-retire`          | None                                                 |
| Restore the app validation baseline before integration rollout       | `bwo-integration-baseline`        | `retire`                                             |
| Integrate optional Ankh auth and versioned Aegis sheet APIs          | `bwo-integration-server`          | `contract`                                           |
| Add opt-in account saving with durable local recovery                | `bwo-integration-sync`            | `storage`, `server`                                  |
| Add an account-free dev-to-root sheet transfer popup                 | `bwo-integration-popup`           | `storage`, `backup`                                  |
| Build root migration guidance and preserve dev recovery routes       | `bwo-integration-origin`          | `backup`, `sync`, `popup`                            |
| Prepare and validate the dev-first integration rollout               | `bwo-integration-devgate`         | `hosting`, `baseline`, `storage`, `backup`, `origin` |
| Prepare main consolidation and root rollout with dev retained        | `bwo-integration-main`            | `devgate`                                            |
| Specify Brighter Worlds storage modes and Parallax provider contract | `bwo-integration-parallax_scope`  | `contract`, `main`                                   |
| Implement Brighter Worlds world-backed sheets in Parallax            | `bwo-integration-parallax_world`  | `parallax_scope`, `storage`, `baseline`              |
| Connect Brighter Worlds rolls, cards and statuses to Parallax        | `bwo-integration-parallax_play`   | `parallax_world`                                     |
| Support account-linked sheets and explicit world/account copies      | `bwo-integration-parallax_linked` | `sync`, `parallax_scope`                             |
| Scope Brighter Worlds NPC, encounter and table integration           | `bwo-integration-parallax_gm`     | `parallax_scope`                                     |

Audit, hosting inventory, the versioned sheet contract, migration recovery, backup/restore and Miro/PeerJS/Narrator retirement have been approved in Mux. Validation baseline verification and optional Ankh/Aegis server integration have been approved. Opt-in account persistence is ready for review. Discord, inventory handoff and generic browser messaging remain. DNS, redirect rules and deployment checkpoints are recorded in hosting-inventory.md; account-service hosting gates are in account-services.md. Origin transfer and remaining implementation/preparation tasks stay queued. Parallax scope waits for main consolidation. Prerequisite abbreviations above refer to the suffix after `bwo-integration-`.
