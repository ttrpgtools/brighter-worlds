# Character and game backups

The character list provides a secondary **Backups and restore** button beside **New Character**. It opens the shared app dialog with **Back up local characters**, **Download game backup**, and a clearly styled **Choose backup file** control with a restore preview. **Advanced recovery** contains the private recovery archive action. Each local character's download button still exports that character with the available linked companion graph; warnings or errors open the dialog for review. No account or cloud service is required for local backups. Character-card backup icons and account-sheet storage-menu downloads export the separate owner-scoped cached companion group; see [account-persistence.md](account-persistence.md). Game backups remain browser-local.

## Portable data

An account-free [old-site transfer pop-up](sheet-transfer.md) now uses the same validated importer and collision policies. Its source page can also download selected character groups for ordinary file restore when the windows cannot connect.

Character files use the v1 sheet/bundle contract in [sheet-format.md](sheet-format.md). Existing unversioned JSON character files are accepted too. The runtime converter has tested expected outputs for both historical fixtures, preserving zero/false values, custom statuses, legacy damage/magic rules, ordering and nested magic. Existing records are not changed by export.

Game files use `brighter-worlds.browser-backup`, version 1, validated by `src/lib/data/sheet-format/browser-backup-v1.schema.json`. They contain a character bundle (or null), game data categories and their image attachments. The nine categories are:

| Category            | Included data                                                                                  |
| ------------------- | ---------------------------------------------------------------------------------------------- |
| Custom NPCs         | `bw-gm-npcs`: reusable NPC stats, attacks, notes and images.                                   |
| Custom relics       | `bw-gm-relics`: authored items, magic and images.                                              |
| Encounters          | `bw-encounters`: encounter descriptions and NPC definitions.                                   |
| Playmat             | `bw-playmat`: independent NPC instances with current grit/attributes/status, items and scenes. |
| Scenes              | `bw-gm-scenes`: descriptions, images and GM notes.                                             |
| Custom tables       | `bw-gm-tables`: formulas, result ranges and typed entity snapshots.                            |
| Friends             | `bw-gm-friends`: die size, slots, notes and source NPC references.                             |
| GM roll log         | `bw-rolllog2`: display records, dice/results and timestamps.                                   |
| Player activity log | `bw-player-log`: display records and timestamps.                                               |

Portable files exclude Discord webhooks, sheet/encounter settings, sign-in/session credentials, account/cache metadata, UI preferences, peer/game connection IDs, migration journals and raw recovery archives. Activity logs are display-only: old CTA buttons, message metadata and interaction URLs are deliberately excluded. These portable files may still contain personal notes, GM secrets and user-authored content; choose what to share.

Unknown fields are excluded through field-by-field allowlists with warnings; their originals remain in browser storage, and imported original file bytes are archived locally. Damaged records/categories are reported rather than silently represented as complete. Full exports can include the healthy subset with visible incomplete-backup warnings; a requested individual character that cannot be exported produces an error. The private archive preserves originals when a normal export is not possible.

HTTP(S) image URLs remain remote references, not downloaded image backups. Native raster Blobs become base64 attachments checked against declared MIME/signature, decoded size and SHA-256 digest. Restore recreates byte-identical Blobs. Image URLs containing credentials, ephemeral blob URLs, SVG/HTML, missing bytes, incorrect checksums and oversized portable attachments are rejected. Limits are 512 KiB per sheet, 16 MiB per portable file, 2 MiB per attachment and 8 MiB combined attachments. Images and resources are never fetched from external URLs during validation.

## Restore and collisions

Selecting a file validates its entire structure, companion manifest, unique IDs, URL policy and attachments before any writes. Preview lists every character and existing GM category. Imported HTML descriptions are sanitized before the existing sheet renders them as HTML; the exact original file remains in local recovery storage.

- If any character differs from an existing copy or has a deletion marker, **Keep both** creates the complete incoming linked group with new sheet IDs. Ability/item IDs remain stable within each sheet, and all included companion targets are remapped together. Existing sheets are never overwritten.
- **Keep current copies and skip conflicts** imports the other records, leaving skipped companion links visibly unavailable. It never attaches an unrelated local sheet with the same ID. An explicit unresolved manifest can retain that unavailability even when another independently selected sheet happens to use the target ID.
- Identical verified documents can remain unchanged. Blob-bearing existing destinations are conservatively treated as conflicts rather than compared only by MIME/length.
- Existing game categories are kept by default. Replacement requires the checkbox and a fresh preview. The previous category is archived in the same transaction. Concurrent edits invalidate the preview; binary-bearing existing categories should be kept or restored into an empty browser/profile rather than replaced using an incomplete comparison.
- The entire selected restore, original-file archive, replaced-game archives and content-bound receipt commit atomically. A quota/clone/verification failure rolls everything back. The UI reports an error and leaves the preview available to retry.
- Retrying the same transfer after a lost acknowledgment uses its receipt and does not duplicate records, overwrite newer edits or resurrect deleted copies. The result says **already applied**, rather than pretending a new write happened. **Prepare another linked copy** is a separate explicit operation with new IDs and a distinct retry identity.

Open character stores are retained after restore, so unrelated unsaved edits are not discarded by clearing the cache. Export includes current open-sheet snapshots when available, including edits whose disk write failed. Reopen other sheet/GM pages to read newly restored data, and close other Brighter Worlds tabs before replacing GM categories.

## Private recovery archive

This separate download requires acknowledgment that it can include original webhooks and private settings. It is for private/manual recovery, not sharing or ordinary restore. Version 2 includes raw localStorage text, tagged IndexedDB records/archives, and current open-sheet snapshots. Tagged graphs preserve Sets, Maps, Dates, cyclic references, typed buffers and arbitrary Blob bytes without silently converting them into empty objects. Portable image/schema limits do not discard oversized bytes from this explicit recovery path. Read failures are recorded as warnings. Account cache rows, transfer receipts and account recovery records are included only for the selected signed-in or last verified offline owner. Other owners' caches remain untouched and excluded. Account-sheet recovery can include the current in-memory draft even when IndexedDB cannot be read.

The ordinary importer intentionally rejects the version-2 private archive with an explanation. Damaged/ambiguous originals need review before they become game data or private settings again. Old version-1 original-localStorage recovery files can be read as legacy sheet input, with invalid rows reported and originals kept.

## Build and verification

JSON Schemas remain the source of truth. `scripts/generate-sheet-validators.mjs` precompiles and bundles validators; build/test scripts regenerate the checked-in `compiled-validators.js`. There is no runtime Ajv compiler, `eval` or `new Function` in the validator artifact, which keeps it usable in Cloudflare Workers. Ajv and esbuild are development dependencies; the sanitizer is a runtime dependency. Generated code has adjacent type declarations and is excluded from formatting.

Tests cover exact legacy normalization, native Set/Blob round trips, companion closure/cycles, complete graph remapping, malformed/future formats, corrupt attachments, read-only exports, unsaved edits, changed destinations, transaction rollback, repeated/concurrent imports, fresh-copy operations, nine game categories, private-field exclusion, replacement archives and private recovery graphs. Run `pnpm test:unit --run` and `pnpm check` to verify the implementation. Automated tests do not establish live browser download/restore, privacy or quota behavior.

The retired Narrator/Miro routes no longer open their old live feed. This does not delete `bw-player-log` or `bw-rolllog2`; both remain included in game backups as display-only history. Old session IDs and private webhook settings remain excluded from portable files.
