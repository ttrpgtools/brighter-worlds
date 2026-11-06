# Optional account sheets

The character library uses one set of cards for local and account characters, with desktop/cloud indicators and All / Local / Account filters. **New character** offers **New local character** and, when account storage is allowed, **New account character**. Signed-out users see a sign-in action for account creation. Unknown attributes on uncached online sheets are left unknown until the sheet is opened.

New account characters and their companions are written atomically into the owner-scoped account cache, then opened as account sheets and queued for online saving. They do not create extra local characters. Creation errors keep the wizard draft open with retry and download options. Companion save failures keep durable drafts and show attention in the storage menu.

Signing in does not upload existing local sheets. Each sheet now has a compact storage menu beside the account and main menus, using a desktop or cloud icon. Account status appears in the trigger tooltip/accessibility label and a saved/pending/attention dot. Save, check, backup, local-copy, duplicate, recovery and deletion actions live inside this menu; conflict comparison and destructive confirmations still open dialogs. The sheet toolbar occupies a reserved row instead of covering the character sheet or the account controls.

Open a local sheet's storage menu and choose **Save online** to preview the character and its available companions, then confirm the copy. After the complete linked group is acknowledged, Save online promotes the originals into account characters and opens the account sheet automatically. Their owner-scoped browser cache provides offline editing; there is one editable character. Original local records are archived atomically before retirement, old links redirect to the account identity, and old open local tabs cannot recreate retired records. Changed local drafts are preserved rather than discarded. Existing copy-style saves are reconciled only when a content-bound receipt proves the complete local group is unchanged.

Account sheets use the existing `bwo` application and `pc` collection in Aegis. Root, dev and localhost share that account library when their service bindings and Ankh registrations are configured. Their browser caches remain separate. No origin redirect, deployment or Parallax integration is included here.

## Local durability and saving

An account URL contains its document ID and `account` owner ID. This query value selects a cache, not permission: the server derives identity from fresh Ankh verification. Each storage request carries an expected-owner header; a changed session is rejected before touching Aegis. An absent header remains compatible with the original API contract.

Account drafts live outside the legacy `bw-sheet-` namespace, under `bw-document:v1:account:{encodedOwner}:{id}`. Each atomic record includes the character, owner, format version, local revision, acknowledged revision, remote storage version, base document, pending request and any conflict/error. Private settings stay in that browser record and never enter the portable server payload. Signing out or switching accounts hides another owner's drafts without deleting them. An outage permits reading/editing only the last verified owner's cached sheets; a verified sign-out clears that offline identity. This is browser cache isolation, not encryption or protection from somebody with access to the browser profile.

Edits save locally before network requests and automatically queue online saves after a short debounce. **Save now** retries explicitly; a browser online event also retries. Network, authorization, quota, local disk and image errors retain the draft and show an unsaved/error state. Reload resumes cached drafts and pending requests. Local write failure stops online writes and keeps the current in-memory snapshot available for download/private recovery; export before closing the page.

Requests serialize per open document. A persisted pending request records exactly the portable document, local revision and expected storage version. Its acknowledgment marks only that revision saved. Edits during requests, document comparisons and cache refreshes remain visible and dirty until confirmed. Lost responses reconcile by reading the server and comparing the exact pending payload. They never justify a blind overwrite. Separate tabs use cache-token checks: a competing draft is archived and the stale tab stops saving until reload.

## Transfers and companions

Initial Save online follows the portable companion graph. Missing companions or embedded image bytes block the group before cloud writes. If an existing cached or remote document differs, the entire group receives fresh IDs and companion links are remapped together. Matching documents can be reused without creating duplicates.

A content-bound transfer receipt and every account draft commit locally before the first cloud mutation. Uploads report individual outcomes because the HTTP API does not offer a multi-document transaction. Retrying the same selection reuses the recorded IDs, preserves newer edits, and does not recreate deleted documents. A removed transfer cache is reported as missing rather than called successful or recreated automatically. Only a fully acknowledged group can promote its local originals. Explicit linked duplicates remain a separate copy action. A deliberate **new linked copy** uses a distinct receipt and fresh IDs.

Opening an account sheet also caches its available linked group, preserving dirty cached companions. Companion links retain the owner scope. Existing inventory handoff recognizes that scope and updates the account draft through the same save queue. Discord, local sheets, generic browser messaging and file restore remain available.

## Conflicts, deletion and recovery

An online version change pauses saving and retains both documents. **Review both copies** provides a comparison and full portable downloads. The user can:

- Use the online copy after archiving the draft and reviewed remote document locally.
- Save a new linked copy while retaining the original documents.
- Replace online using exactly the reviewed storage version. Another intervening update produces another conflict.

Editing after a review invalidates that preview. A document deleted elsewhere is not recreated by retrying an update; the cached draft remains available for a separate copy or download.

**Delete online** is a separate confirmed, versioned action and retains the cached draft plus a recovery archive. **Remove browser cache** is available in the library, archives that row locally, and never deletes the online sheet. **Keep a local copy** uses the existing validated file restore path with fresh linked IDs. Portable downloads omit credentials and private settings. Private recovery includes raw settings/webhooks after an explicit warning and limits account rows/receipts/recovery records to the selected owner; local/GM recovery data remains included.

## Images and rollout verification

Online saving currently supports HTTP(S) image URLs. Embedded Blob images remain supported by browser sheets and file backups, but online transfer rejects them with a clear message. No image bytes are silently dropped or published. Aegis's public/cropped artwork service needs a separate product decision before it can handle arbitrary sheet/item art.

Automated tests cover two independent cached controllers against versioned storage, offline reloads, account switching, stale responses, edits during saves/comparisons/refreshes, lost acknowledgments, local write failures, conflict replacement/reload, deletion, companion remapping, sensitive exclusions and partial/repeated transfers. UI smoke checks use the already-running local app and a synthetic local character. No real account upload or deletion was used for verification. Live two-device/origin behavior, deployed bindings/policies and quota handling remain checks for the separately authorized dev rollout described in [account-services.md](account-services.md).

Validation after the UX follow-up: **209 tests in 21 files pass**; `pnpm check` reports **0 errors and 0 warnings**. The Pages production build succeeds; both hosting build targets also passed during the persistence implementation. Formatting and diff checks pass. Svelte analysis checks the changed components. Existing rich descriptions remain guarded by `sanitizeDescription`; dynamic wizard navigation preserves the resolved application base.
