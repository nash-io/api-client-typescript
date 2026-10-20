## Context

See `proposal.md` for motivation and the three capability specs for behavior. The current `Client` owns credential creation/login and a constructor-local HTTP sender shared by GraphQL queries and mutations. `login` currently installs unvalidated decoded credentials before fetching markets, assets, and nonces. `createApiKey` calls the account mutation before producing the base64 MPC export. The `APIKey` type comes from `nash-protocol`.

The checked-in `schema.graphql` exposes only `createApiKey(name: String!)`, whereas the existing operation already sends password and two-factor arguments. It has no request-public-key argument, and the mutation is absent from the validation registry. This is a backend-contract prerequisite, not permission to guess GraphQL spelling or suppress query validation.

The inspected Rails OpenAPI server prefix is `/rails/api/v1`. The authentication guide's environment table instead lists `/api/v1`, and its request examples use `/rails/api/v1`. No Rails URL exists in the current environment contract. `bitcoinjs-lib@5.0.5`, which includes `ECPair`, already appears in `yarn.lock` through `nash-protocol`; it is not a direct SDK dependency. Node >=14 and TypeScript 3.8 remain constraints.

## Goals / Non-Goals

**Goals:**
- Serialize and sign once at HTTP dispatch, sharing one canonical signer across GraphQL and Rails.
- Keep one credential lifecycle owned by `Client`; expose Rails methods without growing the existing exchange method namespace or introducing a second login path.
- Make public API coverage auditable against the operation table in `specs/nash-rails-api/spec.md`.
- Keep customer context immutable and per request; never store a current Rails customer on the client.

**Non-Goals:**
- No transport framework, OpenAPI code-generation toolchain, automatic pagination, automatic retries, replay queue, clock synchronization service, or websocket signing protocol.
- No changes to order/MPC nonce algorithms or conversion of existing exchange methods into Rails methods.
- No inbound HMAC authentication or outbound webhook verification framework. Return documented webhook secrets without conflating them with the request key.

## Decisions

### 1. Extend the exported secret locally; generate a dedicated ECPair

Use `ECPair.makeRandom` with secure library-default randomness and compressed public keys before invoking the creation mutation. Register `pair.publicKey.toString('hex')`; retain `pair.privateKey.toString('hex')` only locally. Merge `request_signing_key` into the object returned by the existing MPC generation flow before base64 encoding. Do not rewrite payload fields or modify upstream protocol types. Define a local intersection type extending the imported `APIKey` with required `request_signing_key` for the client's authenticated secret.

Declare the already-resolved `bitcoinjs-lib` version directly if imported, rather than relying on hoisting or installing a new ECPair stack. Use Node's SHA-256 facility for hashing where compatible with the existing build. Dependency changes must use the project's Yarn version and run its dependency gates.

Alternative rejected: reuse the payload key or derive a request key from it. The registered request key is independent and old exports cannot be repaired without matching backend registration.

### 2. Validate before installing credentials

Decode and validate into local variables before modifying `mode`, authorization, websocket token, secret, or headers. Check base64/JSON structure, required key type, exact hex length, and the secp256k1 scalar range with ECPair private-key construction. Reject invalid credentials with a descriptive, secret-free error. Only then install the secret and request signer, preserving the existing initialization sequence. All HTTP initialization requests consequently see the validated signer. Validation failures leave any previous session untouched; rolling back every possible subsequent backend initialization failure is outside this change.

Alternative rejected: lazily checking on the first Rails request. That would leave authenticated GraphQL initialization unsigned and accept unusable credentials.

### 3. One pure request signer; retain transport-specific response handling

Add a small signing module under `src/client/` that accepts the request private key, timestamp, method, finalized URL, optional customer ID, and canonical body value. Build `timestamp + '\n' + method.toUpperCase() + '\n' + pathnameAndSearch + '\n' + customerId + '\n' + bodyValue`, hash UTF-8 bytes with SHA-256, and hex-encode ECPair's compact 64-byte signature. Do not encode DER, prepend a recovery byte, or add a terminator.

At the shared GraphQL HTTP dispatch, build the JSON body once, sign it when `mode === MPC`, and send that same string. Keep GraphQL response handling and `ApolloError` behavior intact. Keep the anonymous, full-secret, and websocket branches intact. Rails uses the same signer but its own response parser and error class; avoid extracting a general-purpose HTTP framework merely to share `fetch` calls.

Finalize headers after merging caller headers, resolving reserved names case-insensitively so casing cannot preserve a stale duplicate. Derive authentication headers only from the current credential and request context. Disable automatic redirects for protected HTTP requests. Retain the existing 30-second request timeout discipline with timer cleanup on all outcomes.

Alternative rejected: static signed headers on login. Every signature binds a particular path, body, context, and dispatch timestamp.

### 4. Expose a Rails namespace with explicit base URL

Add optional `railsApiUrl` to `EnvironmentConfig`; adding it is nonbreaking for exchange-only construction. Do not populate unverified production/sandbox defaults from host substitution. Document the inspected development value and require explicit overrides until each deployment is verified. Validate the URL when used: preserve its complete prefix, require HTTPS remotely, permit HTTP only with the existing explicit local-development flag, and reject embedded credentials or unexpected query/fragment components.

Expose `client.rails` as a small `RailsClient` in `src/client/rails.ts`, with domain types in the existing public types chain. Its named methods mirror SDK camelCase verb/resource conventions (`listCustomers`, `createCustomer`, `getCustomer`, `createQuote`, `confirmBuy`, `listApiKeys`, `completePayloadSignature`, `getOpenApi`, etc.). Put the complete method-to-route mapping beside the implementation, using the spec's 46-row table as the coverage checklist. Use `Client`'s current credential through a narrow closure so an existing Rails namespace sees successful relogin and never retains a superseded request key. This is a concrete helper for the existing facade, not a pluggable transport interface or independently authenticated second client.

Use URL/URLSearchParams for finalized query serialization, encode each dynamic path segment, and retain the base URL's prefix when joining paths. A leading slash must not discard that prefix. The public OpenAPI method uses HTTP without authorization even when the enclosing client is logged in. Protected Rails methods fail locally unless API-key credentials exist. The exchange websocket option never routes Rails calls through a socket.

Alternative rejected: adding 46 ambiguous methods directly to the already large `Client`, or deriving a Rails hostname from `opts.host`.

### 5. Keep operation context and wire contracts explicit

Customer resource methods take the path customer ID directly. Customer-scoped wallet challenges/registration, bank verification, payment methods, and quote operations take an explicit customer ID and use it in `nash-customer-id`. Customer-specific resource reads/writes use that same ID for path and header where the route is customer-scoped. Partner metadata, customer directory/create, blockchains, partner order history, webhook management, API-key metadata, and low-level signing use partner context; a `customer_id` listing filter remains a query filter, not an authorization header. Confirm the deployed route scope classification during implementation against the guide/route documentation and a scoped read-only credential, without inferring scope merely from OpenAPI's shared security scheme.

Operation methods accept typed bodies and documented pagination/filter fields. State-changing methods accept optional `idempotencyKey`, forwarded unchanged. Preserve complete response envelopes, nullability, string monetary values, cursors, environment fields, and one-time webhook secrets. Use specific types where the source schema specifies them and open object types where it does not; do not invent fields for underspecified signing payloads. Existing MPC request body signatures remain separate from HTTP headers.

Represent backend failures as `RailsApiError` with HTTP status, stable backend code/message when present, and safe available response details. Handle empty/non-JSON errors without losing status. Do not replace existing GraphQL errors with the Rails error type. Never log secrets or raw uploaded document data.

Alternative rejected: global customer headers, response unwrapping, generated idempotency keys, and raw-only generic request access; these would lose isolation, metadata, or named API coverage.

### 6. Materialize multipart once

For compliance documents accept binary buffers plus filenames/content types, serialize `documents[]` parts once with the final boundary, hash the resulting buffer, and transmit that exact buffer. Use a multipart facility already available through the chosen existing HTTP package if it can expose exact serialized bytes; otherwise use the minimal existing compatible multipart dependency as a declared direct dependency. Do not add an independent upload framework. Set the matching multipart content type and `nash-content-sha256`, then sign the digest string as the canonical body value.

Buffering is a deliberate ceiling: this SDK path targets compliance documents, not unbounded file streaming. Document the deployed backend's upload limits once verified. Do not invent a client limit or a fake streaming digest that hashes different bytes from the sent boundary. A future streaming design would need exact prehash/spooling rather than changing this protocol.

### 7. Verify behavior, not wrappers

Keep focused permanent checks for the published fixed signature vector, tampered canonical fields, invalid secret rejection without network/state mutation, first-login HTTP signing, independent request keys, concurrent customer isolation, and multipart byte integrity. Exercise error-code propagation and public unauthenticated OpenAPI retrieval. Avoid 46 mock-echo tests or source-text assertions.

During apply, run a throwaway local HTTP receiver with a known request key and inspect/verify captured GraphQL and Rails requests, including JSON, query encoding, bodyless actions, and multipart. Use a coverage script to compare the operation table with named methods and the fetched OpenAPI routes without permanently testing copies of dispatch wiring. Then run a live read-only authenticated Rails request if an appropriately scoped credential is available; never create customers, execute fiat actions, or revoke credentials as a smoke check without authorization.

## Risks / Trade-offs

- [Breaking secret requirement] → document a breaking release and replace/re-export registered credentials; no legacy bypass or payload-key fallback.
- [Stale GraphQL schema and unverified request-key argument] → fetch the target schema, confirm the actual GraphQL argument mapping to backend `request_public_key`, register the mutation in `processSchema.ts`, and run query validation. Missing backend support blocks delivery of credential creation, not a reason to add an ignored field.
- [Authentication guide base-path discrepancy] → require explicit `railsApiUrl`; validate actual deployment paths instead of silently trying both prefixes.
- [OpenAPI omits per-route customer header declarations] → verify the documented route classification during apply and exercise partner/customer read calls with appropriate credentials. Customer context remains explicit in the SDK API.
- [GraphQL endpoint support differs by deployment] → verify signed `/api/graphql` on the configured exchange backend; never swallow a signature rejection or downgrade to unsigned traffic.
- [Identical requests signed within one second can replay] → document the server's rejection and surface `replay_detected`. No undocumented nonce header, timestamp drift, automatic retry, or serialization queue is introduced.
- [Clock skew beyond 30 seconds] → propagate `invalid_timestamp` and document host clock synchronization; no clock service is added.
- [Multipart memory proportional to upload size] → retain exact-byte buffering for the bounded compliance use case and document verified server limits; streaming requires a separately justified design.
- [Node >=14 / TypeScript 3.8 / fetch package compatibility] → use APIs supported by the repository's actual runtime/build and run CommonJS plus ESM build gates; do not turn this into an unrelated dependency modernization.

## Migration Plan

1. Verify target backend request-key registration and authenticated GraphQL HTTP support, refresh its schema, and confirm its Rails base URL and route scopes.
2. Implement and verify new credential creation plus strict login validation, shared signing, all Rails operations, and public exports together; do not ship a partially authenticated namespace.
3. Publish a breaking release note and examples showing how to obtain a matching registered credential and configure `railsApiUrl`. Existing exchange-only environment objects remain usable, but old API-key secrets do not.
4. Consumers create or re-export compatible credentials before switching SDK versions, validate read-only traffic, then revoke superseded credentials separately if appropriate. API-key creation remains the existing interactive/MPC path; no REST creation/rotation endpoint is assumed.
5. If backend capability or deployment compatibility fails verification, withhold the release or roll back the SDK version. Do not fabricate a private key for an old export or re-enable unsigned authentication in this version.
