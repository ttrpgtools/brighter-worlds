# Hosting and origin inventory

The dated inventory below is the original checkpoint. The 6 November refresh first encountered credential failures; the owner's renamed/updated `X_CF_API_TOKEN` then verified current Pages settings/deployments, Worker names, the empty zone route list and deployed Ankh/Aegis source registration/exports. Pages DNS and public old-app responses are unchanged. The requested dev-first Worker migration and Git build setup are prepared in source; see [rollout-evidence.md](rollout-evidence.md) and [dev-rollout.md](dev-rollout.md) for fresh evidence and the remaining runtime gates. No live hosting mutation has been performed.

Recorded 5 November 2026 using read-only GitHub, Cloudflare API and public HTTP requests. DNS, zone ruleset and Page Rule checks are now complete using the owner-provided zone token in `.env.local`; the installed Wrangler OAuth credential alone lacked those permissions. Credential values are excluded from this report. No hosting settings, records, deployments or Git history were changed.

## Verified branches and deployment checkpoints

GitHub's live branch API and `git ls-remote` agree with the local audit:

| Branch            | Current commit                             | Hosting evidence                                                                                                                                    |
| ----------------- | ------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `main`            | `f83b14b985a705e2fc05c4408818704c9aadbfe8` | Successful production deployment `69560c5f-7d12-46d1-a6ce-9d36f807ebba`, created 17 June 2026.                                                      |
| `npc-sheets`      | `13d6ece542b9458b96341a739cf26b5d558e7103` | Successful preview deployment `56e2f876-048e-4d40-a597-cedf322d1dad`, created 30 June 2026.                                                         |
| `simple-play`     | `e215a4b4b8ae5d7c09b6581069c3208a7574482d` | Successful preview deployment `c4398e57-4452-4305-ae63-9add2d217906`, created 7 September 2025. Its experimental gameplay does not need preserving. |
| `tech-stack-file` | `277f37b1355f47c740cdc8075e16bdfde464c4cc` | Documentation-only branch; no release prerequisite.                                                                                                 |

Repository: `ttrpgtools/brighter-worlds`, public, default branch `main`. The branch API reports all four branches unprotected. No fetch or ref mutation was needed.

## Pages configuration

One Git-connected Cloudflare Pages project, **brighter-worlds**, owns both custom domains. Its configuration is:

- Production branch `main`; production deployment on Git push enabled.
- Preview deployment policy `all`, include `*`, no branch exclusions.
- Build command `npm run build`, repository root build directory, output `.svelte-kit/cloudflare`.
- Project subdomain `brighter-worlds.pages.dev`.
- Both `brighterworlds.app` and `dev.brighterworlds.app` are active custom domains.
- Both preview and production environments report compatibility date `2023-03-05`, with no flags. No application service bindings were found in the inspected configuration.
- The project's canonical deployment is the production commit above; the latest deployment is the `npc-sheets` preview above.
- The zone’s Worker routes API returns no routes. DNS branch alias routing and the legacy www redirect are verified below.

The canonical deployment's alias list includes both custom domains, while public dev HTML references the same modern entry assets as the `npc-sheets` branch alias. DNS confirms that dev selects the preview branch alias. Do not treat the production deployment alias list alone as proof that dev serves `main`.

Git integration means a future push could trigger a release. Git pushes and hosting changes remain separately gated by explicit authorization.

## Observed public behavior

All requests below were ordinary GET requests without sheet data or account cookies. Redirects were followed, so the table records final URLs rather than asserting individual redirect status codes or the rule that caused them.

| Requested URL                                   | Final URL / observation                                                           |
| ----------------------------------------------- | --------------------------------------------------------------------------------- |
| `https://brighterworlds.app/`                   | Same URL, 200; older app markup.                                                  |
| `https://dev.brighterworlds.app/`               | Same URL, 200; modern Svelte entry assets `start.D8LzoEH7.js`, `app.Ch4Lyoyk.js`. |
| `https://www.brighterworlds.app/`               | `https://brighterworlds.app/`, 200.                                               |
| `http://brighterworlds.app/`                    | `https://brighterworlds.app/`, 200.                                               |
| `http://dev.brighterworlds.app/`                | `https://dev.brighterworlds.app/`, 200.                                           |
| `https://brighter-worlds.pages.dev/`            | Same URL, 200; older app markup.                                                  |
| `https://npc-sheets.brighter-worlds.pages.dev/` | Same URL, 200; same entry asset names as dev.                                     |

The root/dev responses inspected did not include explicit `Cache-Control`, CSP, `Cross-Origin-Opener-Policy`, `Cross-Origin-Embedder-Policy` or `X-Frame-Options` headers. This is a snapshot of these routes, not proof about every route, asset or cache rule. Test the future migration routes' effective headers, popup opener retention and cache behavior explicitly.

The Pages aliases are additional origins. If the app has been used there, those browser records are separate too. Include an escape hatch for exporting there; do not promise automated enumeration of all preview deployment origins. HTTP/www redirects likewise cannot recover any data that might historically have been written at those origins; no evidence of such data was inspected.

## Auth/storage and domain decision

Keep **brighterworlds.app** as the intended canonical domain. Moving to a `ttrpg.tools` subdomain is not required by the inspected Ankh architecture, and would create another browser-storage migration.

Ankh consumers use host-local cookies, redirect/ticket/completion flows, an exact origin allowlist and private service bindings. These do not depend on the consumer sharing Ankh's top-level domain. Ankh's own `COOKIE_DOMAIN=ttrpg.tools` also exists for its own/legacy flows; consumer sessions must use the modern host-local contract rather than copying legacy domain cookies.

Since the initial audit, the sibling Ankh checkout gained commit `0e53c5b`, **Add Brighter worlds root domain**, on 5 November 2026. `src/apps.ts` now lists root, dev and local under `bwo`. That source change was not made by this task; deployed registration still needs confirmation through release metadata or an authorized integration test.

Live Worker metadata confirms existing Workers named `ankh` and `aegis`, each at compatibility date `2026-06-13`. Aegis's observed binding names contain no `ALLOWED_APP_IDS` override. Worker settings metadata does not prove the deployed RPC export names, implementation or schema; verify these at the integration gate. No production database contents or secret values were read.

Cloudflare documents [Pages service bindings](https://developers.cloudflare.com/pages/functions/bindings/) and [trusted service-binding context props](https://developers.cloudflare.com/workers/runtime-apis/context/#props). Before assuming the current Pages setup can directly consume the modern Ankh/Aegis RPC contract, verify support for named entrypoints and trusted `props.appId=bwo` in the actual Pages configuration/deployment path. If unavailable, prepare a Worker-hosting migration at the same public domains. That is a hosting choice, not a reason to move the public domain or weaken the trusted app identity contract.

## Verified DNS and rules

The new zone token successfully read DNS records, zone rulesets and legacy Page Rules. The DNS result was one complete page (13 records total); only relevant web host records are recorded here.

| Host                     | Type  | Target                                 | Proxy   | TTL  |
| ------------------------ | ----- | -------------------------------------- | ------- | ---- |
| `brighterworlds.app`     | CNAME | `brighter-worlds.pages.dev`            | Proxied | Auto |
| `dev.brighterworlds.app` | CNAME | `npc-sheets.brighter-worlds.pages.dev` | Proxied | Auto |
| `www.brighterworlds.app` | CNAME | `brighter-worlds.pages.dev`            | Proxied | Auto |

Dev therefore follows the moving `npc-sheets` preview alias, not a fixed deployment URL. This agrees with the public entry-asset comparison and the latest successful preview commit. Root uses the Pages production hostname, which follows `main`.

There is one legacy Page Rule, ID `1199ff6c2ff1f1785015212426b6b836`, active at priority 1: `www.brighterworlds.app/*` forwards to `https://brighterworlds.app/$1` with status 301. It was last modified 9 March 2023.

The zone ruleset list contains only Cloudflare-managed normalization, response firewall, free WAF and DDoS rulesets. It contains no custom Single Redirect, Bulk Redirect, Origin Rule, URL rewrite, response-header transform or cache ruleset. No zone rule currently redirects dev to root or rewrites its origin; the dev CNAME supplies the branch choice. This inventory describes this zone, not unrelated account-level configuration.

Reading the optional `always_use_https` setting returned 403 with the new token. Public requests already verify HTTP → HTTPS behavior; knowing which setting implements it is not a blocker for storage work and does not require expanding the token now.

The desired later routing policy is:

- Root is the public entry point with a prominent **Find sheets from the old site** action on the character list.
- A dedicated dev transfer route (proposed `/migrate`) and old `/character/{id}` deep links remain on dev.
- Redirecting only the dev landing page `/` to root is an option after the transfer experience is live and validated. Do not redirect the entire origin; preserve query-bearing transfer/callback flows and all recovery routes.
- Use a temporary, reversible redirect during validation. A permanent cached redirect must not make recovery inaccessible.

Rollback checkpoints are the exact deployment IDs above plus the DNS/rule/binding configuration recorded above. Preserve the preview branch CNAME until an explicitly authorized release changes it. Merely rolling code back to the old localStorage application is unsafe after new writes: rollback must preserve new data and recovery formats.

## Remaining validation

No additional GitHub access is needed. The installed Cloudflare credential covers Pages/Worker inventory, and the owner-provided token completed DNS/rule inventory. No further access is needed for the next local migration work. Additional HEAD probes for a sample character path/query returned 403 without a redirect location, so path/query preservation was not established by that probe and remains a browser/release check. The unread optional HTTPS-setting value is documented above. Live sheet mutation, login, browser migration, build execution and preview testing were not part of these read-only requests. No development server was launched.

## Account-service hosting preparation

The account-service implementation adds an explicit `wrangler.worker.toml` alternative without changing the default Pages build or live hosting. Pages documents named service entrypoints, but its published API does not expose the trusted `props` required by Ankh/Aegis; generic Wrangler config acceptance alone does not prove deploy-time preservation. See [account-services.md](account-services.md) for evidence, the tested local Worker build and the same-origin dev-first migration gate. The available Wrangler credential returned 401 for deployed Ankh source verification; local source registration is confirmed, deployed registration is not. No new key, infrastructure mutation, deployment or domain change was performed for this task.
