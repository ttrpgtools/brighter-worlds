# Retired play integrations

Miro embedding, the PeerJS game mesh, and the Narrator feed/iframe bridge have been retired. Parallax integration remains a later task. This cleanup makes no hosting, DNS, origin, or persisted-data changes.

## Compatibility routes

`/play/with-miro/[id]`, `/play/log`, and `/bridge` remain reachable as informational pages with links to characters/backups and GM tools. They no longer embed external maps, connect to a signalling service, accept MessagePorts, or forward wildcard window messages. Character deep links and `/character/obtain?item=…` remain active.

The only removed package dependencies are `peerjs` and `split.js`; the latter was used exclusively by the Miro panel layout. The Narrator-only player-log writer and game-ID accessor are removed. Existing player/GM activity logs and old settings are left in browser storage. Both log categories remain covered by the portable game backup; private recovery can retain original settings. This change does not rewrite old saves or change the portable format.

## Retained sharing and inventory

- Discord roll, NPC, scene and item adapters and webhook preferences remain. Character item sharing now actually calls the existing Discord adapter when enabled, so its title links to the obtain-item route. Character magic sharing and GM formula rolls also honor Discord sharing.
- Item links carry the existing UTF-8/base64 JSON payload on the current origin. The recipient opens a sheet on that same origin in the same browser/profile, opens the link, chooses a discovered character and receives the item. Matching item names stack quantities as before. The sender's inventory is not automatically decremented; the link grants a copy, and revisiting it can grant another copy. This is a local handoff, not an authenticated transfer protocol.
- Invalid item payloads show an error before a sheet is touched. Receipt is displayed only after the sheet loads and its save resolves. A storage failure leaves an explicit warning instead of claiming success; users should inspect inventory and recovery before retrying.
- `broadcast-hub.ts` still discovers open sheets on `bwo-roll-call`. Picker subscriptions now own their channels, so opening a picker after a sheet in the same tab works. Request IDs and per-tab presence IDs prevent repeated discovery from inflating modern tab counts. Closing/unsubscribing cleans up channels, delayed sheet callbacks cannot send after close, and older tabs' presence messages remain supported. A manual check refreshes stale presence after abrupt tab closure.
- `channel-child.ts` and the `bwo-roll-channel` event payloads remain, including roll requests/replies and item/magic/NPC/scene embeds. GM outbound events now use this native channel instead of PeerJS; incoming events are logged without reflection. Self-published GM rolls are not logged twice, and reopening GM tools does not process a retained event as a new roll response.
- `broadcast-store.ts`, cross-tab sheet/list persistence, shared Discord formatting and CTA types remain. The old `rollToBridge` settings key remains compatible, with the user-facing label **Broadcast between browser tabs**. This channel does not cross devices or origins. Future Parallax work should adapt these domain operations deliberately.

## Verification

Automated checks cover both root/dev Discord item-link round trips (including Unicode), retained event types and no echo, multiple/repeated same-tab pickers, two open tabs of one character, old presence messages, cleanup, invalid payloads, inventory stacking and failed/pending saves. Existing migration, backup, persistence and game-tool checks continue to run. Production compilation and Svelte/TypeScript checks validate the compatibility pages and removed imports.

No dev server or live browser-storage test was run. Before rollout, exercise a two-tab inventory receipt, a test Discord webhook, GM roll sharing and the retired URLs on both origins. Browser storage remains scoped to its origin; this cleanup does not implement the later dev-to-root migration popup.
