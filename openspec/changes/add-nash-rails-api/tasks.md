## 1. Confirm backend contracts

- [ ] 1.1 Retrieve the target exchange GraphQL schema and confirm the creation argument that maps to backend `request_public_key`, including the existing password/two-factor contract. Refresh `schema.graphql` from that deployment rather than hand-inventing schema fields; report missing backend support as a prerequisite failure.
- [ ] 1.2 Reconcile the inspected Rails OpenAPI document with the 46-operation coverage table in `specs/nash-rails-api/spec.md`; verify the target base prefix, route customer/partner scope classification, multipart requirements/limits, and stable error envelopes using the linked guide and deployed documentation.
- [ ] 1.3 Confirm that the target GraphQL HTTP backend accepts the documented request signature on its configured path. Obtain appropriately scoped test credentials for live read-only verification if available; never downgrade to unsigned traffic to bypass absent server support.

## 2. Request credentials and strict initialization

- [ ] 2.1 Use the existing resolved ECPair-capable `bitcoinjs-lib` version as a declared direct dependency if imported; regenerate the root lockfile with the project's Yarn version. Reuse existing compatible HTTP/hash/multipart facilities and add no unrelated upgrades or code-generation tooling.
- [ ] 2.2 Update `Client.createApiKey` and its GraphQL mutation/argument types to generate `ECPair.makeRandom` before creation, register the compressed hex public key, and append the matching hex `request_signing_key` only to the local base64 secret while preserving MPC fields and returned identifiers.
- [ ] 2.3 Register the credential-creation operation in `src/client/processSchema.ts` so query validation covers the changed backend contract.
- [ ] 2.4 Extend the SDK's local authenticated-secret type without changing upstream MPC key roles. Validate decoded secret shape, base64/JSON encoding, hex key length/type, and scalar range before installing credentials or disconnecting a prior session; reject legacy keys without fallback and without secret disclosure.

## 3. Shared HTTP request authentication

- [ ] 3.1 Implement the five-field canonical request SHA-256 signer using the independent request key and compact 64-byte ECDSA hex output; preserve exact encoded path/query, empty fields, and UTF-8 body bytes.
- [ ] 3.2 Integrate the signer into the shared authenticated GraphQL HTTP query/mutation dispatch, serializing once and installing the validated signer before login's initialization requests. Preserve anonymous, full-secret, websocket, MPC payload-signing, and existing GraphQL error behavior.
- [ ] 3.3 Finalize reserved authentication headers case-insensitively after caller-header merging, use per-dispatch Unix seconds, disable protected-request redirects, and retain timeout cleanup. Do not add automatic retries, replay workarounds, or a clock service.

## 4. Rails transport, configuration, and public types

- [ ] 4.1 Add optional explicit `railsApiUrl` configuration with preserved prefixes, remote HTTPS/local HTTP validation, and clear missing-configuration errors only when Rails is used; keep exchange-only client construction valid.
- [ ] 4.2 Expose `client.rails` backed by current `Client` credentials through a narrow closure. Implement shared Rails HTTP dispatch with URL/query/path encoding, per-request customer context, explicit idempotency keys, and credential-free public OpenAPI retrieval independent of websocket settings.
- [ ] 4.3 Model documented request bodies, responses, enumerations, nullability, pagination, environment fields, and one-time webhook secrets using string money values and preserving response envelopes. Keep source-schema open objects open and payload signatures distinct from HTTP signatures.
- [ ] 4.4 Add structured `RailsApiError` propagation for HTTP status and stable backend code/message, including non-JSON/empty failures, without leaking private keys, webhook secrets, or document contents in diagnostics.
- [ ] 4.5 Implement compliance multipart serialization once into exact bytes with `documents[]` parts, matching boundary/content type, lowercase SHA-256 content digest, and canonical signing of that digest. Document the buffering ceiling and verified backend upload limits.

## 5. Complete named Rails operation coverage

- [ ] 5.1 Implement public OpenAPI retrieval, partner metadata, customer directory/create/read, KYC, terms, and all compliance operations, including multipart document submission, from the spec's operation table.
- [ ] 5.2 Implement blockchain listing, wallet challenge/registration/reads, bank-account verification, and payment-method listing with the documented customer context.
- [ ] 5.3 Implement quote listing/create/dry-quote/read, all seven quote actions, and partner order history; preserve customer filters versus authorization context, query cursors, amounts, and response envelopes.
- [ ] 5.4 Implement webhook subscription listing/create/cancel/secret rotation, subscription and partner delivery listings, and API-key metadata listing/read/revocation. Do not invent REST key creation or key rotation.
- [ ] 5.5 Implement all seven low-level signing operations, retaining their documented MPC request body signatures while applying independent HTTP request authentication.
- [ ] 5.6 Wire the Rails namespace and public domain/error types through the existing package export chain; verify consumer imports and named coverage for all 46 operations, not only a generic request function.

## 6. Behavioral proof and repository gates

- [ ] 6.1 Keep focused deterministic behavior checks for the published fixed signature vector, canonical-field tampering, independent creation keys, invalid secret rejection without network/auth-state mutation, and signed first-login HTTP requests; preserve anonymous/full-secret/websocket and existing MPC behavior.
- [ ] 6.2 Cover per-customer concurrent requests, reserved-header case conflicts, exact Unicode/query serialization, bodyless operations, multipart raw-byte digest/signature integrity, public unauthenticated OpenAPI access, and structured/non-JSON/replay errors without wrapper-echo or source-text tests.
- [ ] 6.3 Run the actual SDK against a throwaway local HTTP receiver that verifies captured GraphQL and Rails signatures with a known public key. Exercise JSON, encoded pagination, concurrent customer reads, a bodyless action, and multipart, then compare named operation coverage with the deployed OpenAPI table. Put temporary files under `$TMPDIR` and remove the throwaway receiver after use.
- [ ] 6.4 Run a live read-only Rails call and signed GraphQL HTTP call with a compatible credential when available. Do not execute customer creation, funds/quote actions, webhook changes, or credential revocation as smoke tests. Report exact missing credentials/backend prerequisites for any unexercised live gate.
- [ ] 6.5 Run lint, explicit TypeScript type-check, unit tests, both CommonJS/ESM builds, query validation after build, and public API documentation generation. Run `yarn audit --level critical` after dependency changes; report failures and unavailable gates accurately rather than describing unrun checks as passing.

## 7. Consumer documentation and migration

- [ ] 7.1 After behavioral smoke proof, update `README.md` and API documentation with strict `request_signing_key` requirements, registered-key replacement/re-export guidance, explicit Rails URL configuration, customer-scoped and partner-scoped examples, multipart/idempotency usage, and structured errors.
- [ ] 7.2 Add a breaking-change entry to `CHANGELOG.md` explaining legacy-secret rejection, separate MPC/request/webhook keys, exact request signing on Rails plus authenticated GraphQL HTTP, the 30-second timestamp window, identical same-second replay rejection, and unchanged websocket signing behavior.
