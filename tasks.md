# Node upgrade and VitePress documentation

## Recommendation

Move development and CI to Node 24 first. Then replace the standalone TypeDoc HTML site with VitePress guides and a TypeDoc-generated Markdown API reference, still hosted on GitHub Pages.

Keep Yarn 1.22.22, the existing CommonJS/ESM outputs, and the SDK's current minimum runtime requirement initially. Changing the build environment does not itself justify dropping consumer support. Avoid unrelated dependency, lint, test-framework, or module-system migrations.

## 1. Upgrade the build environment

- [x] Pin Node 24 for local development and use it in `.github/workflows/build-and-test.yml` and `.github/workflows/deploy-gh-pages.yml`.
- [x] Update the old checkout and setup-node Actions to supported releases. Explicitly provision the pinned Yarn 1.22.22; do not assume Yarn is bundled with Node.
- [ ] Perform a clean `yarn install --frozen-lockfile` on Node 24, including Linux CI and Apple Silicon development. Check native crypto installation and the macOS GMP prerequisite.
  - Apple Silicon: isolated clean install passed on Node 24.20.0 with Yarn 1.22.22; GMP header present. Optional fsevents 1.2.12 failed to compile against Node 24, but installation succeeded without it. Linux remains unverified: local Docker cannot start (`com.docker.cli` missing); the updated Linux CI workflow must run remotely.
- [x] Keep existing dependencies and compiler settings unchanged for this first step unless a demonstrated compatibility failure requires a targeted fix.
- [x] Run lint, TypeScript checks for both build configurations, unit tests, coverage, both builds, and the existing documentation command. Inspect warnings and document any blockers rather than treating skipped checks as passing.
  - Node 24.20.0: lint, both no-emit checks, 18 tests (3 suites), coverage generation, clean CommonJS/ESM builds, and legacy docs passed. Jest required `--watchman=false` locally because the sandbox blocks Watchman's state directory. A clean dependency reinstall removed stale Babel artifacts. Coverage is 56.46% lines, not the separate 100% `cov:check` threshold. Legacy TypeDoc emits circular-dependency warnings.
- [x] Exercise actual SDK request signing and protocol signing/key derivation on Node 24. Module loading alone is not proof that native crypto works.
  - `node scripts/runtime-smoke.js` passed: request signature verification/tamper rejection, BIP-39 entropy/seed vectors, and verified protocol signature. Apple Silicon uses the SDK's existing WASM runtime adaptation, not the upstream macOS native binary.
- [ ] Keep `engines.node` at its existing range only if the published SDK remains compatible. Verify the advertised minimum separately; if a required change drops that support, explicitly decide and document the new runtime floor and release impact.
  - Runtime range remains unchanged. Minimum-version smoke is blocked locally: the official Node 14.3 macOS x64 binary downloaded successfully but cannot execute (`Failed to open libRosettaRuntime`); Node 14.3 has no macOS ARM64 binary. Recheck the final published build on a compatible x64/Linux runner before claiming minimum-runtime compatibility.
- [x] Update contributor setup instructions with Node 24, Yarn 1.22.22, and native prerequisites.

## 2. Replace the documentation site with VitePress + TypeDoc

- [x] Select mutually compatible versions of VitePress, TypeDoc, `typedoc-plugin-markdown`, and its VitePress integration. Verify their Node and TypeScript requirements before installation.
  - Selected VitePress 1.6.4, TypeDoc 0.28.20, typedoc-plugin-markdown 4.14.1, and typedoc-vitepress-theme 1.1.4 from npm metadata. Plugins require Node >=18 and TypeDoc 0.28.x; TypeDoc accepts TypeScript 5.0.x–6.0.x. Start with TypeScript 5.0.4 (minimum supported major) and retain Node typings unless a compiler error requires otherwise.
- [x] Upgrade TypeScript only as required by the selected TypeDoc version. Check compatibility with ts-jest, TSLint, and existing declarations; update only tooling that demonstrably needs it. Do not blindly update `@types/node` or expose newer Node APIs to SDK consumers.
  - TypeScript 5.0.4 passed both no-emit checks and TSLint with existing Node typings. ts-jest 24 failed (`ts.getMutableClone is not a function`), requiring Jest 29.7.0, ts-jest 29.2.6, and Jest typings 29.5.14; all 18 tests then passed without cache. TSLint-immutable declares an older TypeScript peer range, but lint executes successfully.
- [x] Use the root package and existing Yarn lockfile for documentation tooling. Generate lockfile changes with Yarn 1.22.22; do not add a nested package or lockfile.
- [x] Replace the legacy TypeDoc CLI flags in `yarn doc` with a pipeline that generates API Markdown and builds the VitePress site. Add development/preview commands for inspecting the actual site.
  - `yarn doc` successfully generated Markdown and built VitePress; `doc:api`, `doc:dev`, and `doc:preview` are available. TypeDoc reported 23 stale parameter-comment warnings, with no errors.
- [x] Generate documentation for the public SDK exports, covering `Client`, environments, Rails APIs, errors, options, and public request/response types. Exclude private/internal implementation details and external dependency internals.
  - TypeDoc JSON inventory matched all 230 non-internal exports from `src/index.ts`; environments/options are generated from a second entry point. Inspected `Client` and `RailsClient` signatures and linked response types. Existing `@internal` exports remain intentionally excluded.
- [x] Keep generated API pages separate from authored guides and regenerate them before every docs build; do not maintain signatures by hand or retain stale generated pages.
  - Generated output is isolated/ignored under `website/api/` and excluded from npm publication. A seeded stale page disappeared after `doc:api`, while the authored landing page survived.
- [x] Create a concise landing page and guides for installation, authentication, a first request, trading, subscriptions, and Rails APIs. Reuse accurate existing documentation and examples; do not copy stale behavior without checking it.
  - Five guides cover all listed topics. All five TypeScript examples passed semantic checks against SDK source; the full site built with internal-link checking. Examples involving accounts/trades were not sent to a live backend.
- [x] Add navigation between guides and API reference, generated API sidebar entries, and VitePress local search. Use the default theme rather than building a custom theme.
  - Production build passed with the generated sidebar and local-search index. VitePress warns about a >500 kB chunk; no custom chunking or warning suppression added. Interactive verification is recorded under the browser-preview task below.
- [x] Configure the GitHub Pages base path as `/api-client-typescript/`. Verify internal links, assets, source links, and generated type links under that prefix.
  - Production preview passed in Chromium under the prefix; 240 built pages and 60,809 internal links/assets/anchors passed the emitted-site checker. Fixed an existing unclosed JSDoc code fence that hid later API methods, removed stale empty parameter tags, and corrected the cancellation example. TypeDoc now builds without warnings. API type/source links were inspected in the browser.

## 3. Deploy and verify

- [x] Update `.github/workflows/deploy-gh-pages.yml` to publish the VitePress build output, including `.nojekyll`, using a supported deployment action. Keep the existing `v*` release-tag trigger and GitHub Pages URL.
  - Release workflow targets `website/.vitepress/dist` with deployment action v4 and explicit contents-write permission; release-tag trigger and gh-pages branch are unchanged. Actual remote deployment remains a separate unchecked gate.
- [x] Preserve the existing `/api-client-typescript/docs/` compatibility landing link used by nash.io. Inspect other published entry points and preserve redirects for externally linked pages whose paths change.
  - Inspected the live `globals.html` inventory (Client, ClientOptions, EnvironmentConfig). Chromium verified all five legacy entry paths, the Client `#login` fragment, and the environment-configuration globals link. `.nojekyll` and redirects are generated by `yarn doc`, not deployment-only shell commands.
- [x] Build the site in normal CI as well as release deployment, failing on generation errors and broken internal links.
  - Both workflows call the complete `yarn doc` pipeline, including emitted-page link/asset/anchor checks. A deliberately injected missing link failed the checker; the unmodified production output passed.
- [ ] After dependency changes, run lint, type checks, unit/coverage checks, both SDK builds, the documentation build, and `yarn audit --level critical`. Interpret Yarn's audit exit-code bitmask correctly; lower-severity findings must not be mistaken for critical ones.
- [ ] Preview the built site in a browser under its deployment base path. Exercise navigation, local search, code examples, API signatures/type links, compatibility links, and narrow-screen layout. Check for failed assets and browser errors.
- [ ] Update README documentation/contribution links and add a changelog entry. Remove obsolete TypeDoc configuration and generation steps after the replacement is verified.
- [ ] Verify the deployed site after the next release deployment. Record local-preview evidence separately from deployment evidence and live-backend acceptance.

## Completion criteria

- Node 24 clean installation, build, test, and signing checks pass on the intended platforms, with any unavailable external-service checks explicitly recorded.
- The SDK's declared runtime support matches verified behavior; changing the documentation toolchain has not silently changed consumer requirements.
- `yarn doc` produces a complete VitePress site with generated TypeScript API reference and authored guides.
- CI builds the site, release deployment publishes the correct output, and browser checks confirm the GitHub Pages base path works.

## References

- [VitePress integration for TypeDoc Markdown](https://typedoc-plugin-markdown.org/plugins/vitepress/quick-start)
- [TypeDoc](https://typedoc.org/)
- [VitePress deployment guide](https://vitepress.dev/guide/deploy)
