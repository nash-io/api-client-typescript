# Contributing

## Setup

Use Node 24 (`nvm install && nvm use`, with `.nvmrc`) and Yarn 1.22.22:

```sh
npm install --global yarn@1.22.22 --force
yarn --version
yarn install --frozen-lockfile
```

On macOS, install GMP before installing dependencies:

```sh
brew install gmp
```

Native dependency compilation may also require Xcode Command Line Tools on macOS, or Python, make, and a C/C++ toolchain on Linux. The protocol package does not supply a macOS ARM64 native MPC binary; the SDK already adapts its WASM runtime on that platform. Old optional `fsevents` may fail to compile on Node 24 without failing the installation.

Node 24 is the development/build runtime, not a change to the published SDK's declared Node minimum. Verify consumer compatibility separately before raising `engines.node` or using newer runtime APIs.

## Checks

```sh
yarn test:lint
yarn build
yarn test:unit --runInBand
yarn test:unit:cov --runInBand
node scripts/runtime-smoke.js
yarn doc
yarn audit --level critical
```

For no-emit checks, run `yarn tsc --noEmit -p tsconfig.json` and `yarn tsc --noEmit -p tsconfig.module.json`. Use a clean build before testing compiled output. If Watchman is unavailable, append `--watchman=false` to Jest commands.

The runtime smoke checks a request signature (including tamper rejection), BIP-39 vectors, and a protocol signature without credentials or a backend. Coverage generation is distinct from `yarn cov:check`, which requires 100% coverage. Yarn Classic's audit exit code is a severity bitmask: `--level critical` filters displayed findings, not the exit code; CI fails on critical findings or an audit execution error.

Manual scripts under `integration-tests/` require real environment configuration and credentials. Local signing verification does not establish live backend acceptance. Never commit credentials.
