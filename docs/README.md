# Documentation

This directory contains public documentation for product behavior, data contracts and codebase maintenance.

## Sheets and storage

- [Sheet format](sheet-format.md): portable documents, schemas, identities and compatibility fixtures.
- [Storage recovery](storage-recovery.md): browser persistence, migration and recovery behavior.
- [Backups and restore](backups.md): portable files, game data and private recovery archives.
- [Finding and moving sheets](migration-guidance.md): supported migration and recovery paths.
- [Cross-origin sheet transfer](sheet-transfer.md): consent, protocol, durable receipts and fallback behavior.

## Accounts and integrations

- [Account services](account-services.md): authentication, service bindings and HTTP APIs.
- [Account persistence](account-persistence.md): local drafts, online saves, companions and conflicts.
- [Retired play integrations](retired-play.md): compatibility routes and retained sharing behavior.

## Contributing documentation

Keep product instructions, architecture, data/API contracts, code organization and contributor or agent guidance in the public repository. Write them so a reader can use them without access to internal plans or conversation history.

Keep infrastructure inventories, operational runbooks, rollout execution records, dated audits and internal task plans under `private/docs/`. The existing `private/` directory is Git-ignored. Public documentation must stand on its own without links into that directory. Avoid recording credentials in documentation, including private notes.

Keep current behavior separate from dated execution evidence. Document repeatable verification commands publicly; retain environment-specific results and remaining operational gates in the private notes.
