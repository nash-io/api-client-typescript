# AGENTS.md

`@neon-exchange/api-client-typescript` — the official TypeScript SDK for the Nash exchange, published to npm. It talks to GraphQL over HTTPS, a Phoenix/Absinthe websocket, and a separately configured Rails REST API. MPC payload signing and key derivation come from `@neon-exchange/nash-protocol`; authenticated HTTP uses an independent secp256k1 request key. Node >= 14, Yarn 1 only (preinstall enforces it; macOS also needs `brew install gmp` for the protocol's native crypto).

## Commands

- `yarn build` — clean, then compile twice: `build/main` (CommonJS, package `main`) and `build/module` (ESM, package `module`). Build before running anything that consumes `build/main` (integration tests, `validate-queries`, `generate-types-queries`).
- `yarn test` — build + lint + unit tests (npm-run-all `test:*`).
- `yarn test:lint` / `yarn test:unit` / `yarn test:unit:cov` — tslint, jest, jest with coverage.
- `yarn cov:check` — enforces 100% lines/functions/branches coverage (nyc).
- `yarn fix` — prettier + tslint --fix.
- `yarn generate-schema:<env>` — pull `schema.graphql` from a live server (`sandbox`, `prod`, `dev1-4`, `local`, ...). Run when the server schema changes.
- `yarn validate-queries` — validates every registered GraphQL operation against `schema.graphql`. Run after touching queries/mutations/subscriptions.
- `yarn generate-types-queries` — regenerates `src/client/schemaTypes.ts` (not checked in).
- `yarn doc` — TypeDoc API reference from `src/client/client.ts`, `src/client/environments.ts`, `src/client/rails.ts`, and `src/types/rails.ts`; deployed to gh-pages on `v*` tags.
- Releases: `standard-version` (`yarn version`) driven by conventional commits. Husky pre-push runs lint + unit. CI (GitHub Actions, Node 14) runs lint, unit, coverage, build, doc on every push.

## Architecture

The public `Client` facade lives in `src/client/client.ts` (~3.6k lines); the Rails REST surface and shared HTTP signer live in `src/client/rails.ts` and `src/client/requestSigning.ts`.

- `src/queries/`, `src/mutations/`, `src/subscriptions/` — one file per GraphQL operation, each exporting an `UPPER_SNAKE` `gql` tagged template plus co-located `Params`/`Data` types; shared pieces live in `fragments/` subfolders per domain (market, order, movement, ...).
- `src/client/processSchema.ts` — the registry: every operation must be added to its `queries` map or `validate-queries` won't see it.
- GraphQL transport is defined in the `Client` constructor: `this.gql.query` POSTs to `<host>/api/graphql` via node-fetch (30s timeout), or uses the Absinthe socket when `runRequestsOverWebsockets` is set and logged in. The separate `client.rails` transport uses explicit `EnvironmentConfig.railsApiUrl`; authenticated Rails calls require MPC credentials and the independent request key, while `getOpenApi()` is public.
- Auth modes (`ClientMode` in `src/types/client.ts`): `NONE` (not logged in), `MPC` (API-key login — payload signing delegated to the server via `preSignPayload` + `dhFillPool`, HTTP signing uses a separate locally held request key), `FULL_SECRET` (local payload signing via `signPayload` from nash-protocol). `requireMPC()`/`requireFull()` guard methods by mode; `signPayload` dispatches on mode.
- Subscriptions: lazy `client.subscriptions` getter builds a Phoenix socket (`wss://<host>/api/socket`) wrapped in Absinthe. All `on*` handlers use Absinthe `observe` except `onUpdatedOrderbook`, which joins a raw Phoenix channel (`public_order_book:<market>`). Account subscriptions call `wsAuthCheck` — login first.
- State syncing: the exchange requires signed state every ~100 open orders. With `autoSignState` (default on), order placement auto-triggers `signStates` when `ordersTillSignState` drops below the threshold; on `missing_asset_nonces` errors the client refetches nonces (`updateTradedAssetNonces`).
- Movements (deposits/withdrawals/external transfers): multi-step flow `prepareMovement` → sign → `addMovement` → `updateMovement`, with a retry loop (15s sleep + re-prepare) on `PREPARE_MOVEMENT_MUST_BE_CALLED_FIRST`/`BAD_NONCE`. ETH/Polygon ERC-20 transfers need an allowance first (`approveAndAwaitAllowance`, unlimited approval).
- Batch orders (`placeLimitOrders`, `cancelOrders`, `cancelAndPlaceOrders`) synthesize one aliased GraphQL mutation with letter variable names A–Q — batches cap at 17 operations.
- `src/types/` — public domain types (Order, Market, Movement, ...). `src/constants/currency.ts` — `CryptoCurrency` enum. `src/helpers/` — `createCurrencyAmount`/`createCurrencyPrice`, market precision normalization (BigNumber, 8-decimal floor format), `markets.default.ts` fallback market list. `src/config/` — env-overridable URLs + `SALT` (empty on purpose; changing it breaks signing).
- Public entry `src/index.ts` re-exports the `src/client` and `src/types` barrels plus constants, helpers, and config. Public Rails classes/errors are exported from `src/client/index.ts`; Rails domain types from `src/types/index.ts`.

## Conventions & gotchas

- Lint is tslint (not eslint) with prettier `singleQuote`; several recommended rules are off (see `tslint.json`). Don't introduce ESLint config or reformat untouched code.
- Unit tests: Jest + ts-jest; `testMatch` picks up `*.spec.ts`/`*.test.ts` under the repo. Focused request-signing tests live in `src/client/httpAuthentication.spec.ts`; other unit specs include `src/client/utils.spec.ts` and `src/helpers/currency.spec.ts`. `src/client/client.spec.integration.ts` is commented-out dead harness.
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

## Development lessons

- **Worked:** establish contracts from the deployed schema and OpenAPI, then verify the complete operation inventory with a local signature-verifying receiver.
- **Went wrong:** query validation can log schema errors without returning a failing process status; inspect its output and independently verify the changed operation.
- A local receiver proves serialization and signing, not backend acceptance. Keep live calls as a separate gate and record missing credentials or undocumented limits.
- Restricted workspaces may block Yarn/`nyc` writes outside the sandbox. Keep the pinned toolchain, put scratch files under `$TMPDIR`, and report any skipped wrapper or coverage gate.
- See [agent-guides/development-lessons.md](agent-guides/development-lessons.md) for the observed recovery steps and test/runtime pitfalls.
