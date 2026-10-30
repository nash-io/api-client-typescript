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
- [ ] Update contributor setup instructions with Node 24, Yarn 1.22.22, and native prerequisites.

## 2. Replace the documentation site with VitePress + TypeDoc

- [ ] Select mutually compatible versions of VitePress, TypeDoc, `typedoc-plugin-markdown`, and its VitePress integration. Verify their Node and TypeScript requirements before installation.
- [ ] Upgrade TypeScript only as required by the selected TypeDoc version. Check compatibility with ts-jest, TSLint, and existing declarations; update only tooling that demonstrably needs it. Do not blindly update `@types/node` or expose newer Node APIs to SDK consumers.
- [ ] Use the root package and existing Yarn lockfile for documentation tooling. Generate lockfile changes with Yarn 1.22.22; do not add a nested package or lockfile.
- [ ] Replace the legacy TypeDoc CLI flags in `yarn doc` with a pipeline that generates API Markdown and builds the VitePress site. Add development/preview commands for inspecting the actual site.
- [ ] Generate documentation for the public SDK exports, covering `Client`, environments, Rails APIs, errors, options, and public request/response types. Exclude private/internal implementation details and external dependency internals.
- [ ] Keep generated API pages separate from authored guides and regenerate them before every docs build; do not maintain signatures by hand or retain stale generated pages.
- [ ] Create a concise landing page and guides for installation, authentication, a first request, trading, subscriptions, and Rails APIs. Reuse accurate existing documentation and examples; do not copy stale behavior without checking it.
- [ ] Add navigation between guides and API reference, generated API sidebar entries, and VitePress local search. Use the default theme rather than building a custom theme.
- [ ] Configure the GitHub Pages base path as `/api-client-typescript/`. Verify internal links, assets, source links, and generated type links under that prefix.

## 3. Deploy and verify

- [ ] Update `.github/workflows/deploy-gh-pages.yml` to publish the VitePress build output, including `.nojekyll`, using a supported deployment action. Keep the existing `v*` release-tag trigger and GitHub Pages URL.
- [ ] Preserve the existing `/api-client-typescript/docs/` compatibility landing link used by nash.io. Inspect other published entry points and preserve redirects for externally linked pages whose paths change.
- [ ] Build the site in normal CI as well as release deployment, failing on generation errors and broken internal links.
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
