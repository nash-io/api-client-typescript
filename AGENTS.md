# AGENTS.md

`@neon-exchange/api-client-typescript` — the official TypeScript SDK for the Nash exchange, published to npm. Talks to a GraphQL API over HTTPS and a Phoenix/Absinthe websocket; all payload signing and key derivation comes from `@neon-exchange/nash-protocol`. Node >= 14, Yarn 1 only (preinstall enforces it; macOS also needs `brew install gmp` for the protocol's native crypto).

## Commands

- `yarn build` — clean, then compile twice: `build/main` (CommonJS, package `main`) and `build/module` (ESM, package `module`). Build before running anything that consumes `build/main` (integration tests, `validate-queries`, `generate-types-queries`).
- `yarn test` — build + lint + unit tests (npm-run-all `test:*`).
- `yarn test:lint` / `yarn test:unit` / `yarn test:unit:cov` — tslint, jest, jest with coverage.
- `yarn cov:check` — enforces 100% lines/functions/branches coverage (nyc).
- `yarn fix` — prettier + tslint --fix.
- `yarn generate-schema:<env>` — pull `schema.graphql` from a live server (`sandbox`, `prod`, `dev1-4`, `local`, ...). Run when the server schema changes.
- `yarn validate-queries` — validates every registered GraphQL operation against `schema.graphql`. Run after touching queries/mutations/subscriptions.
- `yarn generate-types-queries` — regenerates `src/client/schemaTypes.ts` (not checked in).
- `yarn doc` — typedoc HTML API docs from `client.ts` + `environments.ts`; deployed to gh-pages on `v*` tags.
- Releases: `standard-version` (`yarn version`) driven by conventional commits. Husky pre-push runs lint + unit. CI (GitHub Actions, Node 14) runs lint, unit, coverage, build, doc on every push.

## Architecture

Single facade: `src/client/client.ts` (~3.5k lines) holds the `Client` class. Everything else is data it consumes.

- `src/queries/`, `src/mutations/`, `src/subscriptions/` — one file per GraphQL operation, each exporting an `UPPER_SNAKE` `gql` tagged template plus co-located `Params`/`Data` types; shared pieces live in `fragments/` subfolders per domain (market, order, movement, ...).
- `src/client/processSchema.ts` — the registry: every operation must be added to its `queries` map or `validate-queries` won't see it.
- Transport is defined in the `Client` constructor: `this.gql.query` POSTs to `<host>/api/graphql` via node-fetch (30s timeout) unless `runRequestsOverWebsockets` is set and logged in, in which case it runs over the Absinthe socket. `gqlToString` (`src/client/queryPrinter.ts`) caches printed query strings.
- Auth modes (`ClientMode` in `src/types/client.ts`): `NONE` (not logged in), `MPC` (API-key login — signing delegated to the server via `preSignPayload` + `dhFillPool`), `FULL_SECRET` (local signing via `signPayload` from nash-protocol). `requireMPC()`/`requireFull()` guard methods by mode; `signPayload` dispatches on mode.
- Subscriptions: lazy `client.subscriptions` getter builds a Phoenix socket (`wss://<host>/api/socket`) wrapped in Absinthe. All `on*` handlers use Absinthe `observe` except `onUpdatedOrderbook`, which joins a raw Phoenix channel (`public_order_book:<market>`). Account subscriptions call `wsAuthCheck` — login first.
- State syncing: the exchange requires signed state every ~100 open orders. With `autoSignState` (default on), order placement auto-triggers `signStates` when `ordersTillSignState` drops below the threshold; on `missing_asset_nonces` errors the client refetches nonces (`updateTradedAssetNonces`).
- Movements (deposits/withdrawals/external transfers): multi-step flow `prepareMovement` → sign → `addMovement` → `updateMovement`, with a retry loop (15s sleep + re-prepare) on `PREPARE_MOVEMENT_MUST_BE_CALLED_FIRST`/`BAD_NONCE`. ETH/Polygon ERC-20 transfers need an allowance first (`approveAndAwaitAllowance`, unlimited approval).
- Batch orders (`placeLimitOrders`, `cancelOrders`, `cancelAndPlaceOrders`) synthesize one aliased GraphQL mutation with letter variable names A–Q — batches cap at 17 operations.
- `src/types/` — public domain types (Order, Market, Movement, ...). `src/constants/currency.ts` — `CryptoCurrency` enum. `src/helpers/` — `createCurrencyAmount`/`createCurrencyPrice`, market precision normalization (BigNumber, 8-decimal floor format), `markets.default.ts` fallback market list. `src/config/` — env-overridable URLs + `SALT` (empty on purpose; changing it breaks signing).
- Public entry `src/index.ts` re-exports `client`, `constants/currency`, `types`, `helpers`, `config`. New public API must flow through that chain.

## Conventions & gotchas

- Lint is tslint (not eslint) with prettier `singleQuote`; several recommended rules are off (see `tslint.json`). Don't introduce ESLint config or reformat untouched code.
- Unit tests: jest + ts-jest, `testMatch` picks up any `*.spec.ts`/`*.test.ts` under the repo. Live specs: `src/client/utils.spec.ts`, `src/helpers/currency.spec.ts`. `src/client/client.spec.integration.ts` is fully commented out (dead integration harness) and does not match jest's pattern.
- `integration-tests/*.js` are manual scripts run against `build/main` and a real environment (`NASH_ENV`, real API keys) — never part of `yarn test`. Same for `examples/` (each has its own package.json).
- Amounts/prices are strings formatted through `BigNumber` with `BIG_NUMBER_FORMAT` (8 decimals, `ROUND_FLOOR`); never use JS numbers for money.
- When the server schema changes: regenerate `schema.graphql`, run `validate-queries`, and fix operations before merging.
- v6 changed order placement incompatibly vs v5 — don't "simplify" signing/nonce logic in `place*Order`; it's load-bearing protocol behavior.
- `yarn clean` deletes `build` and `test`; `.nyc_output`/`coverage` are gitignored artifacts, safe to ignore.

## Dependency and Lockfile Changes

- Run lint, type-check, test, and build gates after any dependency change.
- Run `yarn audit --level critical`
- Keep `yarn.lock` generated by pinned Yarn version. Do not hand-edit it, add unapproved registry sources, or create app-local lockfiles.

If a required gate cannot run because a backend, test account, browser, or external service is unavailable, report the exact skipped gate and blocker. Do not describe unrun checks as passing.
