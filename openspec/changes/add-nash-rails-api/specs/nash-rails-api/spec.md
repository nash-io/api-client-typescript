## Purpose

Expose the complete documented Nash Rails REST surface through typed SDK calls that preserve backend contracts, customer scope, and failure details.

## ADDED Requirements

### Requirement: Complete documented operation coverage

The SDK SHALL expose a named public function for each of the following 46 operations from the [deployed OpenAPI document](https://rails.arm-dev1.nash.io/rails/api/v1/openapi.json), inspected on 2026-10-20. Paths below are relative to the configured Rails API base URL. A generic raw request escape hatch SHALL NOT substitute for named operation coverage. No undocumented credential-creation or credential-rotation REST endpoint SHALL be invented.

| Domain | Method | Relative path |
| --- | --- | --- |
| Surface | GET | `/openapi.json` |
| Partner | GET | `/partner` |
| Customers | GET | `/customers` |
| Customers | POST | `/customers` |
| Customers | GET | `/customers/{customer_id}` |
| Customers | GET | `/customers/{customer_id}/kyc` |
| Customers | POST | `/customers/{customer_id}/kyc/initiate` |
| Customers | POST | `/customers/{customer_id}/terms` |
| Compliance | GET | `/customers/{customer_id}/compliance/requirements` |
| Compliance | POST | `/customers/{customer_id}/compliance/personal-information` |
| Compliance | POST | `/customers/{customer_id}/compliance/source-of-funds` |
| Compliance | POST | `/customers/{customer_id}/compliance/requests/{request_id}/answer` |
| Compliance | POST | `/customers/{customer_id}/compliance/requests/{request_id}/documents` |
| Verification | GET | `/blockchains` |
| Verification | POST | `/wallets/challenge` |
| Verification | POST | `/wallets` |
| Verification | GET | `/customers/{customer_id}/wallets` |
| Verification | POST | `/bank-accounts` |
| Fiat ramp | GET | `/payment-methods` |
| Fiat ramp | GET | `/quotes` |
| Fiat ramp | POST | `/quotes` |
| Fiat ramp | POST | `/quotes/dry-quote` |
| Fiat ramp | GET | `/quotes/{quote_id}` |
| Fiat ramp | POST | `/quotes/{quote_id}/cancel` |
| Fiat ramp | POST | `/quotes/{quote_id}/confirm-buy` |
| Fiat ramp | POST | `/quotes/{quote_id}/confirm-instant-buy` |
| Fiat ramp | POST | `/quotes/{quote_id}/confirm-sell` |
| Fiat ramp | POST | `/quotes/{quote_id}/recalculate` |
| Fiat ramp | POST | `/quotes/{quote_id}/reconfirm` |
| Fiat ramp | GET | `/orders` |
| Webhooks | GET | `/webhooks/subscriptions` |
| Webhooks | POST | `/webhooks/subscriptions` |
| Webhooks | DELETE | `/webhooks/subscriptions/{subscription_id}` |
| Webhooks | POST | `/webhooks/subscriptions/{subscription_id}/rotate` |
| Webhooks | GET | `/webhooks/subscriptions/{subscription_id}/deliveries` |
| Webhooks | GET | `/webhooks/deliveries` |
| API keys | GET | `/api-keys` |
| API keys | GET | `/api-keys/{api_key_id}` |
| API keys | DELETE | `/api-keys/{api_key_id}` |
| Signing | POST | `/signing/dh-pool` |
| Signing | POST | `/signing/payload-signatures` |
| Signing | POST | `/signing/btc-payload-signatures` |
| Signing | POST | `/signing/raw-transactions` |
| Signing | POST | `/signing/transactions/prepare` |
| Signing | POST | `/signing/transactions/iterate` |
| Signing | POST | `/signing/transactions/cancel` |

#### Scenario: Every documented operation is callable

- **WHEN** a consumer imports the SDK's public entry point
- **THEN** a named typed function is available for every operation in the coverage table, including multipart upload, low-level signing, and public OpenAPI retrieval

#### Scenario: Correct operation dispatch

- **WHEN** a consumer calls any documented operation with valid inputs
- **THEN** the SDK sends the documented method, encoded relative path, query, body format, and customer context and returns the backend's documented response

### Requirement: Explicit Rails base URL and transport separation

The SDK SHALL support a Rails API base URL independent of the exchange GraphQL host, preserving any configured path prefix. The inspected development deployment SHALL be usable with `https://rails.arm-dev1.nash.io/rails/api/v1`. The SDK SHALL NOT silently substitute `/api/v1` for `/rails/api/v1`, duplicate the prefix, or derive an unverified Rails host from the exchange host. A missing Rails base URL SHALL reject a Rails operation clearly without breaking existing exchange-only construction. Remote signed traffic SHALL require HTTPS; the existing explicit local-development mode SHALL permit HTTP. Rails calls SHALL always use HTTP regardless of the exchange websocket option.

#### Scenario: Custom prefixed environment

- **WHEN** a client is configured with the inspected development base URL and lists customers
- **THEN** the outgoing path begins with `/rails/api/v1/customers` and that exact path is signed

#### Scenario: Exchange-only client

- **WHEN** a caller constructs the client without Rails configuration and performs an exchange operation
- **THEN** the exchange behavior is unchanged
- **AND** attempting a Rails operation reports the missing Rails base URL rather than guessing a destination

#### Scenario: Exchange websocket option

- **WHEN** the exchange websocket transport option is enabled and a Rails operation is invoked
- **THEN** the Rails operation still uses its configured HTTP endpoint and request signature

### Requirement: Typed inputs and complete backend responses

Public operation inputs and outputs SHALL represent the documented required and optional fields, nullable fields, enumerations, pagination cursors, environment metadata, and one-time returned webhook signing secrets. Monetary amounts SHALL remain strings. The SDK SHALL preserve documented wire-field names and response envelopes rather than unwrap or discard metadata. Open-ended object fields in the source contract SHALL remain expressible without inventing mandatory fields. Low-level MPC signing operation inputs SHALL retain their documented payload signatures separately from HTTP authentication signatures.

#### Scenario: Paginated results and one-time secrets

- **WHEN** customer, order, or webhook-delivery listing returns a cursor, or webhook creation/rotation returns a signing secret
- **THEN** the caller receives that data together with all other documented response fields, including environment metadata

#### Scenario: Low-level payload signing

- **WHEN** a low-level signing endpoint requires an existing payload/signature object
- **THEN** that body remains intact and the HTTP request is additionally authenticated using the independent request-signing key

### Requirement: Explicit customer and idempotency options

Customer-scoped functions SHALL require customer context as described in the authenticated HTTP capability. The SDK SHALL expose documented cursor/filter/page-limit inputs without automatic pagination and SHALL accept an optional caller-supplied `Idempotency-Key` for state-changing operations. It SHALL neither manufacture idempotency keys nor automatically repeat state-changing calls. Partner-wide listings that accept `customer_id` as a filter SHALL keep that filter distinct from customer-scoped authorization.

#### Scenario: Customer filter on a partner listing

- **WHEN** the caller filters the partner's orders or customer directory by `customer_id`
- **THEN** the SDK includes the documented query parameter without treating that filter as implicit customer authorization context

#### Scenario: Idempotent mutation

- **WHEN** a caller supplies an idempotency key on a state-changing operation
- **THEN** the SDK sends that value unchanged as `Idempotency-Key` and surfaces any backend `idempotency_conflict` without retrying

### Requirement: Structured error and authentication behavior

Protected Rails calls SHALL reject locally when API-key authentication is not initialized; public OpenAPI retrieval SHALL be callable without credentials and SHALL NOT attach credential material. Non-success responses SHALL reject with the HTTP status, backend `error.code`, backend `error.message`, and available response details without parsing human-readable messages into codes. Empty or non-JSON failure bodies SHALL still produce a useful status-bearing error. Backend scope, environment, revocation, replay, rate-limit, and domain failures SHALL remain distinguishable. The SDK SHALL NOT log request secrets, webhook secrets, or uploaded document contents in diagnostics.

#### Scenario: Public API description

- **WHEN** an unauthenticated caller requests the OpenAPI document
- **THEN** the SDK returns the document without requiring a secret or transmitting authorization/signature headers

#### Scenario: Stable backend rejection

- **WHEN** the backend returns HTTP 403 with `error.code` equal to `partner_credential_not_allowed`
- **THEN** the consumer can inspect both the status and exact backend code without interpreting the message

#### Scenario: Non-JSON failure

- **WHEN** the backend returns a non-JSON or empty error response
- **THEN** the SDK rejects with the HTTP status and safe available response details rather than exposing only a JSON parsing exception
