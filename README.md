# Brighter Worlds Online Tools

Some tools to assist with playing / running a game of [Brighter Worlds RPG](https://brighterworldsrpg.com) (by David Lombardo).

Created using SvelteKit and Tailwind CSS.

See the [documentation index](docs/README.md) for sheet formats, storage, backups, migration and account APIs.

`pnpm check` validates Svelte and TypeScript. `pnpm test:unit --run` runs the unit suite. `pnpm build` prepares the Cloudflare Worker application without deploying it; `pnpm check:worker` checks the resulting artifact. `pnpm build:pages` prepares a Pages compatibility build.
