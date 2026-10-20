## Why

The SDK creates MPC credentials without an independent HTTP request-signing key and exposes no Nash Rails REST operations. Partners need credentials that register a request public key, authenticate backend requests with the corresponding private key, and access the full documented Rails API without reimplementing signing.

## What Changes

- Generate a fresh secp256k1 pair with `ECPair.makeRandom` for each API-key creation, register its compressed hexadecimal public key as the backend's `request_public_key`, and include its hexadecimal private key as `request_signing_key` in the base64-encoded secret. Preserve all MPC payload-signing material.
- **BREAKING**: Require a valid `request_signing_key` when initializing API-key authentication. Reject old or malformed secrets before installing credentials or sending initialization requests; do not silently derive a key from existing payload-signing material.
- Sign Rails REST and all API-key-authenticated GraphQL HTTP requests, including login initialization, using the documented canonical request digest and compact secp256k1 signature. Preserve unauthenticated, full-secret, and websocket behavior.
- Add typed public SDK functions for all 46 operations in the deployed Rails OpenAPI document: customers/KYC/compliance, wallet and bank verification, fiat-ramp quotes/orders, partner metadata, webhooks, API-key metadata/revocation, low-level MPC signing, and public OpenAPI retrieval.
- Support exact query/body signing, per-request customer context, multipart content digests, caller-supplied idempotency keys, and structured Rails errors. Keep webhook HMAC secrets separate from inbound request-signing keys.
- Document credential replacement, Rails environment configuration, signing constraints, and examples. Do not add retries, a key-rotation REST endpoint, or a new websocket signing protocol.

## Capabilities

### New Capabilities

- `api-key-request-credentials`: Independent request-key registration, secret export, and validated API-key initialization.
- `authenticated-http-requests`: Canonical request signing shared by authenticated GraphQL HTTP and Rails REST, including multipart and customer context.
- `nash-rails-api`: Typed public functions covering every documented Rails REST operation with environment routing and backend error propagation.

### Modified Capabilities

None. This repository had no existing OpenSpec capability specifications when planning began.

## Impact

- SDK surfaces: `Client.createApiKey`, `Client.login`, the shared GraphQL HTTP sender, environment configuration, public exports, and a Rails API namespace on `Client`.
- Likely implementation areas: `src/client/client.ts`, `src/client/environments.ts`, `src/mutations/account/createApiKey.ts`, `src/client/processSchema.ts`, public type/index modules, focused Rails/signing modules, `README.md`, and `CHANGELOG.md`.
- Dependencies: reuse the `bitcoinjs-lib` version already resolved through `nash-protocol` for `ECPair`, declaring it directly if imported by the SDK; reuse SHA-256 and existing HTTP facilities. Generate any lockfile change with the project's Yarn version.
- Backend coordination: refresh the exchange GraphQL schema to confirm the request-public-key argument; the checked-in schema currently lacks it and disagrees with the existing mutation on other arguments. Verify request-signature support on the target GraphQL deployment.
- Sources: [authentication guide](https://rails.sandbox.nash.io/dashboard/guides/authentication), [Rails API docs](https://rails.sandbox.nash.io/rails/v1/docs), and [deployed OpenAPI JSON](https://rails.sandbox.nash.io/rails/api/v1/openapi.json), inspected 2026-10-20. The deployed document specifies `/rails/api/v1`; the authentication guide's environment table specifies `/api/v1`. Configure the base URL explicitly and use the deployed OpenAPI prefix for the inspected environment rather than silently rewriting paths.
