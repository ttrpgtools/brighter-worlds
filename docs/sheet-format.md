# Versioned sheets and storage identities

Contract version: **1**. Task: `bwo-integration-contract`. This defines the contract used by the implemented portable backup layer. The recoverable legacy migration retains compatible runtime records; it does not switch live browser keys to document envelopes. See [backups.md](backups.md) and [storage-recovery.md](storage-recovery.md).

The machine-readable definitions are [sheet-v1.schema.json](../src/lib/data/sheet-format/sheet-v1.schema.json) and [bundle-v1.schema.json](../src/lib/data/sheet-format/bundle-v1.schema.json), using [JSON Schema 2020-12](https://json-schema.org/draft/2020-12/json-schema-core). Their `$id` URLs are stable identifiers, not published endpoints. [types.ts](../src/lib/data/sheet-format/types.ts) provides independent portable types; it deliberately does not derive the payload by spreading the runtime `Character` type. Ajv is a development dependency for contract tests and ahead-of-time validator generation; the app imports precompiled validators.

## Documents and versions

A sheet document contains `format: "brighter-worlds.sheet"`, `version: 1`, a stable `id`, `createdAt`, `character`, and `relations`. See the complete [sheet example](../src/lib/data/sheet-format/fixtures/sheet-v1.json).

- `character` contains name, pronouns, grit, STR/DEX/WIL, statuses, equipment, calling, abilities, eulogy, spells, rituals and notes. Every top-level character field is present in v1; optional entity properties stay optional. Ordered arrays preserve user order.
- `id` is the sheet ID, not its owner or an Aegis version. Keep existing safe IDs, including the current nine-character IDs. New IDs should use `crypto.randomUUID()`. Imported sheet/relation IDs must match `[A-Za-z0-9_-]{1,128}`; invalid legacy IDs require an explicit remap, never truncation. Entity IDs inside a sheet may be empty for historical unnamed entries; the importer must assign any missing IDs consistently before interactive use, and must reject ambiguous duplicate IDs in a collection.
- `createdAt` is Unix milliseconds or `null` when unknown. Do not fabricate a creation time during every import. Legacy `created`/`sortkey` can be ordering tokens such as `1`, not timestamps. Only carry a credible legacy creation timestamp (at least 1 January 2000) into `createdAt`; keep the original values in local recovery metadata/archive and ordering separately.
- Grit values are non-negative safe integers. Attribute maxima are d4/d6/d8/d10/d12; current attributes can also be zero. Zero grit, zero attributes, false flags and empty notes must survive. Do not clamp over-max grit or charges: an importer may warn, but the representation must preserve existing data.
- `statuses` is a unique ordered string array, with custom status names preserved. Runtime conversion uses `Array.from(set)` and `new Set(array)`. Do not hard-code the current built-in status list.
- Keep the existing `eulogy` field, `xp` and `spent` booleans. Epitaph is UI terminology, not a field rename. Preserve the historical `unequiped` spelling too.
- Custom entities/descriptions, magic charge state, scalar/array damage, quantity/formula and arbitrary notes are data. Do not replace saved custom content with the current SRD definitions.
- Legacy `extra` dice and `enableMagic` are explicitly preserved under each usable entity/item's `legacyRules`. Retain the original selector spelling (`spell`, `spells`, `ritual`, `rituals`, `all`) and boolean/object form. This is compatibility data, not an instruction to invent modern magic charges or reinterpret old game rules.
- Runtime symbols, `Set`, `Blob`, `undefined`, NaN, Infinity, functions and cyclic objects are not valid portable JSON. The runtime empty marker is never exported. An empty placeholder with that marker must not become a valid saved character.

The document version describes data shape only. Aegis concurrency versions, Parallax revisions, export IDs and local migration journal versions are independent. Reject unknown versions or format discriminators without rewriting the input; do not treat a future version as an unversioned legacy sheet. New incompatible fields require a new format version and an explicit upgrader. Readers must not discard fields and then save an incomplete future-version document.

## Private and unknown fields

All objects in the schemas use `additionalProperties: false`. Producers construct payloads through explicit field allowlists at every level. Readers reject extra fields rather than silently stripping them and claiming a complete import. Schema validity is not proof of trusted origin or ownership.

Never include `settings`, Discord webhooks, roll-to-bridge/Discord toggles, cookies, tokens, account IDs/permissions, sync metadata, local sorting, window/session state or raw recovery records in a portable sheet/bundle. Keep Discord preferences and webhook secrets in an origin-local settings record, scoped to the relevant local/account identity; sign-in must not publish them. This task does not remove existing Discord settings from runtime sheets.

Unknown legacy fields must survive in the **local recovery archive**, with a visible compatibility warning and path to the original record. They do not enter a generic `extensions` or `legacy` bag in portable JSON: that would allow accidental transmission of secrets. Promote a useful unknown game field only through a reviewed allowlist/migration. The fixtures intentionally contain an unknown legacy field to document this split.

Rich text is preserved as text, not treated as trusted executable HTML. Rendering, link parsing and sanitization remain consumer responsibilities. Shape validation alone does not make an imported description safe for `{@html}`.

## Companions and relation closure

Each companion relation is `{ kind: "companion", abilityId, sheetId }`. `abilityId` refers to a companion ability in this document; `sheetId` refers to the separate companion sheet. Relations are scoped to the same source collection/bundle, not to whichever unrelated browser record happens to share that ID.

For old generated companion HTML, parse only an unambiguous same-source `/character/{id}` link on an ability with `type: "companion"`. Relative links refer to the exporting origin; approved absolute links must have exactly that source origin. Decode/validate the path ID once, preserve custom descriptive text, and move the target into `relations`. The v1 fixture replaces the generated anchor with its label; the renderer will build a link from the relation. Never regex-replace arbitrary IDs throughout all text, infer an external link as an owned companion, or follow/fetch links while importing. Ambiguous markup stays in the archive with a warning for manual recovery.

One ability has at most one companion relation. Require a matching companion ability, unique relation identity and no self-link; distinct abilities may reference the same sheet. Traverse companions with a visited set so cycles between documents cannot cause an infinite export. Copying a graph remaps only structured relations and IDs; future UI must not recreate authoritative companion links solely inside HTML.

## Bundles and images

A bundle uses `format: "brighter-worlds.bundle"`, `version: 1`, an export `id`, `exportedAt` (Unix milliseconds), `source`, ordered `roots`, `sheets`, `assets`, and `unresolvedRelations`. See the [bundle example](../src/lib/data/sheet-format/fixtures/bundle-v1.json). One-sheet downloads use a one-sheet bundle too, making image/dependency handling consistent.

`roots` lists the explicitly selected sheets; `sheets` includes those sheets and the transitive companion closure in deterministic order. `source` reports only origin and storage category. It is descriptive provenance, never a user identity, credential, import destination, trusted messaging target or proof of access. Origin is the exact serialized HTTP(S) origin (no path, query, fragment or credentials), or null for an unknown file source. An exporter must disclose missing or explicitly unavailable companions using `{ sheetId, abilityId, targetSheetId }` entries in `unresolvedRelations` and visibly label the export incomplete. An unavailable relation remains explicitly blocked even if another selected sheet has the same target ID. A restore of an incomplete bundle needs an explicit user choice; it must not claim the companion was transferred.

Images have one of two representations:

- `{ kind: "url", url }` retains an absolute HTTP(S) URL without embedded credentials. Do not fetch it during schema validation, and do not claim remote content is backed up. Data URLs, blob URLs, JavaScript URLs and relative paths require explicit conversion or a recovery warning, not a broken URL in v1.
- `{ kind: "bundle-asset", assetId }` refers to a bundle attachment. For a browser Blob, export its bytes into an `assets` entry with raster media type, base64 data, decoded byte length and SHA-256 digest. Supported types are PNG/JPEG/WebP/GIF; reject SVG/HTML and unsupported media rather than executing it or silently dropping it. Deduplicate identical bytes. A source-less `{}` from an old lossy JSON export cannot reconstruct the image; retain the original and report the missing bytes.

Bundle asset IDs are scoped to that bundle. Verify canonical base64, decoded size, digest and actual raster type before use; declared MIME is not trusted. An asset reference must resolve to exactly one attachment. Recreate Blob URLs for display only and revoke them when disposed. A cloud API must reject unresolved `bundle-asset` references: upload/normalize to an authorized durable image store and replace with its durable URL before saving, or keep the operation local with an explicit error. An ordinary cloud document must not depend on an export file remaining open.

Shape limits: 1,000 sheets/assets/entries per character collection, 128 statuses of at most 128 characters, names at most 512 characters, text fields at most 65,536 characters, and individual decoded image attachments at most 2 MiB. Application-level limits are additionally **512 KiB UTF-8 per sheet document**, **16 MiB total UTF-8 bundle JSON**, nesting depth at most 20, and at most 8 MiB decoded assets per bundle. Enforce total bytes/depth before expensive parsing/validation. These are initial transport bounds, not evidence of a user's quota. Oversized recoverable data stays local and downloadable through an explicitly separate raw recovery path; never trim silently to fit. The 512 KiB document bound matches the inspected Aegis source, and must be rechecked at integration time.

JSON Schema checks structure, enums, extra fields and per-field counts. Importers must additionally enforce bytes/depth, normalized URLs, raster content/digests, ID uniqueness, root membership, relation closure and authorization. `uniqueItems` compares full JSON values; it does **not** establish unique sheet IDs. Keep these semantic checks explicit in the following implementation tasks.

## Duplicate IDs, copies and retries

| Situation                                   | Required behavior                                                                                                                                                                 |
| ------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ID absent at destination                    | Preserve it if valid; create without overwriting.                                                                                                                                 |
| Matching ID and matching normalized content | Show as already present; acknowledge only verified content or a matching committed receipt.                                                                                       |
| Matching ID with divergent content          | Require keep both, skip, or explicit versioned replacement; default to keep both. Never choose by timestamp alone.                                                                |
| Keep both / copy graph                      | Allocate every destination sheet ID up front, then remap all relations with one map. Preserve entity/ability IDs within each sheet. Retain original provenance in local metadata. |
| Missing companion                           | Preserve an unresolved relation visibly, include it in the warning manifest, and do not point it at an arbitrary same-ID destination sheet.                                       |
| Repeated transfer after lost reply          | Reuse a committed, content-bound destination receipt; do not allocate fresh IDs again or overwrite post-import edits.                                                             |
| User edited sheets since an earlier export  | A matching export ID alone is insufficient: verify normalized content/digest and collision policy before any writes.                                                              |

Content digests use SHA-256 of compact UTF-8 JSON with recursively sorted object keys (JavaScript code-unit order), unchanged array order, normal JSON scalar encoding and no Unicode normalization. A document digest covers its entire normalized v1 document. A transfer digest covers ordered roots, ordered normalized sheets and ordered validated asset descriptors (`id`, `mediaType`, `byteLength`, `sha256`); exclude export ID/time and base64 bytes after verifying their content hashes. Bind source origin/export ID separately in the receipt.

Destination receipts contain source origin/export ID, canonical selected-content digest, complete source→destination ID mapping and per-record commit outcomes; they contain no auth credentials. Only successful durable writes/readback produce success receipts. Journal writes, rollback and recovery UX are implementation work for migration/import tasks, not behavior supplied by the schema.

## Storage ownership and keys

Use **Ankh/Aegis app `bwo`, collection `pc`, docId equal to sheet ID** for account PCs and companions. Aegis owns `(userId, appId, collection, docId)` and its optimistic version. `userId` comes exclusively from verified server identity. A file's ID or provenance cannot claim another user's document.

Keep the portable document separate from `SheetStorageMetadataV1`:

| Mode                | Identity                                   | Concurrency and recovery                                                                                        |
| ------------------- | ------------------------------------------ | --------------------------------------------------------------------------------------------------------------- |
| Local               | `(local, documentId)`                      | Existing sheets default to local; stable browser ordering, raw archive and local write journal.                 |
| Account             | `(account, ownerId, documentId)`           | Owner-scoped cache, acknowledged Aegis version, dirty flag, last sync, conflict version and bounded error code. |
| World (later phase) | `(world, worldId, providerId, documentId)` | Host-scoped revision and recovery; never selected by a coincidental local/account ID.                           |

Do not conflate a local sheet and an account cache with the same ID, or two accounts' caches. Account switching changes the selected identity; it cannot reassign dirty data to a new owner. Local Discord settings and sort order are additional local records scoped to that identity. Provenance keeps the original ID, origin, legacy format and optional transfer ID, not ownership authority. No Parallax implementation is introduced here.

Reserved future keys (colon-separated components use `encodeURIComponent` independently):

```text
bw-document:v1:local:{documentId}
bw-document:v1:account:{ownerId}:{documentId}
bw-document:v1:world:{worldId}:{providerId}:{documentId}
bw-storage:v1:{same mode and identity components}
bw-preferences:v1:{same mode and identity components}
bw-recovery:v1:{recordId}
bw-migration:v1:{migrationId}
bw-transfer:v1:{transferId}
```

These never match the current `bw-sheet-` enumeration. Existing `bw-sheet-list` and `bw-sheet-{id}` localStorage/IndexedDB records remain readable until a separately implemented, journaled cutover. Do not write envelopes or metadata into the current runtime record keys. Migration must preserve rollback access and avoid repeatedly importing the retained raw archive.

## Legacy normalization and fixtures

Unversioned source data is **v0 input**, not a valid v1 document. JSON files cannot represent a Set or Blob, so the dev fixture stores statuses as an array and the future runtime-adapter tests must construct actual Set/Blob values separately.

| Fixture                                                                                                                                           | Required conversion / evidence                                                                                                                                                                                                                     |
| ------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [legacy-root.json](../src/lib/data/sheet-format/fixtures/legacy-root.json) → [sheet-v1.json](../src/lib/data/sheet-format/fixtures/sheet-v1.json) | Stable sheet/ability IDs; null creation date; depleted attributes and custom statuses; legacy rules retained; generated companion anchor becomes a relation; settings/unknown fields stay in local recovery only. Webhook is a fake test sentinel. |
| [legacy-dev.json](../src/lib/data/sheet-format/fixtures/legacy-dev.json)                                                                          | Preserve real creation date and local sort order separately, over-max grit, nested spell/charge data and image URL; normalize runtime Sets to arrays.                                                                                              |
| [bundle-v1.json](../src/lib/data/sheet-format/fixtures/bundle-v1.json)                                                                            | A selected PC, resolved companion and a real checked PNG attachment; all roots, relations and attachment references resolve.                                                                                                                       |

Missing legacy optional fields normalize to pronouns/notes `""`, arrays `[]`, statuses `[]`, relations `[]`, and `createdAt: null`. Missing/malformed grit or attributes, invalid known-field types or ID disagreement with the original storage key are recovery cases requiring an explicit decision; do not invent gameplay values or overwrite a good destination. Recover a missing sheet ID from its storage key only when unambiguous, and journal that decision. Preserve valid zero/false values using presence checks rather than `value || default`.

The definition task established the following acceptance criteria. The backup implementation now supplies the upgrader/runtime adapters and tests; persistent migration and restore behavior are described in the implementation documents:

1. Normalize the root fixture to the exact v1 fixture, leaving input and raw recovery source unchanged; report exclusions and unresolved relations.
2. A dev runtime record with actual Set statuses and a Blob image exports to a valid bundle and restores equivalent state and byte-identical images. Known game fields survive; settings and unknown fields remain local.
3. `serialize → JSON.parse → validate → hydrate → serialize` is stable for normalized v1 data, including empty arrays, zero/false values, user ordering and nested magic. The JSON fixture round trips already run in contract tests; the hydrate/upgrade portions now run in the backup tests.
4. Whole-graph copying rewrites parent/companion IDs consistently, repeated transfer is idempotent, and missing/ambiguous dependencies remain visible.
5. Unsupported versions, invalid/oversized/deep data, invalid images and schema violations leave the original bytes and destination unchanged. Any partial durable progress has a resumable journal and accurate per-record outcomes.

The contract tests validate the examples and schema rejection cases; additional backup/migration tests exercise the implemented adapters, transactional storage and restore flows. Cloud saving is still a later task. Run `pnpm test:unit --run src/lib/data/sheet-format/contract.test.ts`.

## Validation recorded

`pnpm test:unit --run`: 6 files / 45 tests passed, including 30 contract checks. `pnpm check`: no new errors; the existing `src/routes/play/log/+page.svelte:80` Cta narrowing error remains. Formatting and `git diff --check` pass. No dev server, storage migration or deployment was run.
