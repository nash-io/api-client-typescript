## Purpose

Authenticate API-key HTTP traffic with signatures bound to the exact transmitted request while preserving existing non-API-key and websocket transports.

## ADDED Requirements

### Requirement: Canonical digest and compact signature

Every protected Rails REST request and every API-key-authenticated GraphQL HTTP request SHALL send `Authorization: Token <credential_id>`, `nash-timestamp` containing current Unix seconds, and `nash-signature` containing the hexadecimal compact 64-byte secp256k1 ECDSA signature over SHA-256 of the UTF-8 canonical request. The canonical request SHALL join exactly five fields with single newline separators and no appended terminator: timestamp, uppercase HTTP method, exact URL pathname including its encoded query string, customer identifier or empty string, and raw body or empty string. Requests without customer context and body SHALL retain both empty final fields. Signatures SHALL use the secret's request key, not MPC payload keys or webhook HMAC secrets.

#### Scenario: Published interoperability vector

- **WHEN** the request key is `01cbefdb07ad492f446edf947085503c1158a5a08262b974eb445de9045bf21a`, the timestamp is `1791907200`, the method is `GET`, the path is `/rails/api/v1/customers?limit=20`, and the customer and body are empty
- **THEN** the canonical bytes end in two newline characters after the path and the signature is `8c3f8c0d4346640135f61fee37f9bb9f762491f49fe11409ec9ce70d39fb73387a7da053a383e2e5ec2fcb8b1635fe8be17635ba9a8db2cd959be1481bf8d0d5`

#### Scenario: Request field integrity

- **WHEN** the method, path, encoded query, customer identifier, or transmitted body changes
- **THEN** the original signature no longer verifies for the changed canonical request

### Requirement: Sign the bytes actually transmitted

The SDK SHALL finalize URL query encoding and body serialization before signing and SHALL transmit those same bytes without reserialization. JSON requests SHALL sign the exact serialized JSON; bodyless requests SHALL sign an empty body rather than an invented JSON object. Path values SHALL be encoded as path segments and query values SHALL preserve valid falsy values such as zero and false. Caller-supplied headers SHALL NOT override the effective credential, timestamp, signature, customer context, or multipart digest after signing. Protected requests MUST NOT forward credentials or signatures to redirect targets.

#### Scenario: Encoded filters and Unicode JSON

- **WHEN** a request contains an encoded cursor and a JSON string containing Unicode or newline characters
- **THEN** signature verification succeeds against the exact path, query, and body captured from the outgoing HTTP request

#### Scenario: Reserved header conflict

- **WHEN** caller headers include a stale signature or a conflicting authorization or customer header
- **THEN** the outgoing protected request uses SDK-controlled values consistent with its actual credential and signed context

#### Scenario: Redirect response

- **WHEN** a protected endpoint returns a redirect
- **THEN** the SDK does not automatically resend its credential or signature to the redirect destination

### Requirement: Per-request customer context

Customer-scoped Rails calls SHALL accept an explicit customer identifier, send it as `nash-customer-id`, and include the same value in the canonical request. Partner-scoped calls SHALL omit the customer header and sign an empty customer field. Concurrent calls for different customers SHALL NOT share mutable customer-header state. Where a customer-scoped operation includes a customer path identifier, its header and path SHALL identify the same customer.

#### Scenario: Concurrent customer calls

- **WHEN** two customer-scoped calls for different customers execute concurrently
- **THEN** each request's path, header, and canonical customer field use that call's customer without leaking the other call's context

#### Scenario: Partner-scoped call after a customer call

- **WHEN** a partner-scoped request follows a customer-scoped request
- **THEN** it omits `nash-customer-id` and signs an empty customer field

### Requirement: Multipart content digest

For multipart document uploads the SDK SHALL compute the lowercase hexadecimal SHA-256 of the complete raw multipart body, send it as `nash-content-sha256`, and use that hexadecimal value instead of the raw body in the canonical request. The transmitted boundary and bytes SHALL match those hashed. Multipart content type SHALL include the actual boundary rather than the JSON default.

#### Scenario: Multiple uploaded documents

- **WHEN** a compliance upload contains multiple binary documents
- **THEN** the parts use the documented `documents[]` name, the content digest matches the complete received multipart body, and the request signature verifies using that digest

### Requirement: HTTP signing scope and replay behavior

API-key-authenticated GraphQL HTTP queries and mutations, including market/asset/nonce requests made during API-key initialization, SHALL carry request signatures. Unauthenticated requests and full-secret authentication SHALL retain their existing behavior. Websocket connection authentication, messages, and subscriptions SHALL retain their existing protocol. Each HTTP dispatch SHALL calculate its timestamp and signature from the finalized request rather than reusing static authentication headers. The SDK SHALL surface timestamp and replay rejections without automatic retry; documentation SHALL describe the server's 30-second timestamp window and rejection of repeated signatures, including identical same-second requests.

#### Scenario: Initial API-key HTTP requests

- **WHEN** API-key login sends its initialization requests over HTTP
- **THEN** every such request is signed with the validated request key

#### Scenario: Existing websocket and anonymous use

- **WHEN** an anonymous client sends a public GraphQL query or an authenticated client uses the existing websocket transport
- **THEN** the SDK preserves that transport's existing authentication behavior without injecting the HTTP canonical signing protocol into websocket messages

#### Scenario: Rejected identical request

- **WHEN** the server rejects an identical same-second request with `replay_detected` or rejects a timestamp with `invalid_timestamp`
- **THEN** the SDK returns the backend error without silently resending or changing request parameters
