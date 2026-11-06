# Brighter Worlds Online Tools

Some tools to assist with playing / running a game of [Brighter Worlds RPG](https://brighterworldsrpg.com) (by David Lombardo).

Created using SvelteKit and Tailwinds.

`pnpm build` prepares the Cloudflare Worker application; it does not deploy it. Dev is the default Worker target, with root held for later validation. See the [dev-first Worker rollout](docs/dev-rollout.md) and [validation evidence](docs/rollout-evidence.md) for configuration, local checks, fixture preparation and the remaining live gates. `pnpm build:pages` retains an explicit compatibility build during the transition.
