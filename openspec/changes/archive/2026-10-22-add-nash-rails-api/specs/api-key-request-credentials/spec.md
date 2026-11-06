## Purpose

Provide independent request-signing credentials that register with the backend and accompany MPC exports without changing account payload-signing material.

## ADDED Requirements

### Requirement: Independent request key registration and export

Each API-key creation SHALL generate a fresh secp256k1 key pair independent of the MPC payload-signing keys. The SDK SHALL submit its compressed, 33-byte hexadecimal public key as the backend field `request_public_key` during credential creation and SHALL include the matching 32-byte hexadecimal private key as `request_signing_key` inside the JSON encoded by the returned base64 secret. Existing MPC secret fields and the returned credential identifier SHALL retain their meanings. The private request key MUST NOT be included in backend requests or diagnostic output.

#### Scenario: Create a credential with an independent request key

- **WHEN** API-key creation succeeds
- **THEN** the backend has received the request public key and the decoded returned secret contains the matching `request_signing_key` alongside the unchanged generated MPC fields
- **AND** the private request key has not been sent to the backend

#### Scenario: Separate credential creations

- **WHEN** two credentials are created for the same account
- **THEN** each creation generates its own request key rather than reusing or deriving it from account payload-signing material

### Requirement: Validate request signing material before API-key initialization

API-key initialization SHALL require a decoded secret object containing a `request_signing_key` that is a 64-character hexadecimal encoding of a valid nonzero secp256k1 private scalar below the curve order. It SHALL reject malformed base64/JSON secrets, missing request keys, wrong types, invalid hexadecimal encodings, wrong lengths, zero, and out-of-range scalars with a descriptive credential error that does not disclose secret contents. Validation SHALL complete before changing active authentication state, disconnecting an existing socket, or sending initialization requests. There SHALL be no fallback to a payload-signing key or automatic generation of an unregistered request key.

#### Scenario: Valid exported secret

- **WHEN** the caller initializes API-key authentication with a valid request key and the existing required MPC fields
- **THEN** the SDK installs the request key before the first authenticated initialization HTTP request and uses it for subsequent request signatures

#### Scenario: Legacy or malformed secret

- **WHEN** the caller supplies a secret without `request_signing_key` or with malformed request-signing material
- **THEN** initialization rejects before sending any request or replacing the client's previous authentication state
- **AND** the error identifies the credential problem without including the secret or private key

### Requirement: Preserve account MPC signing and define credential migration

Request signing SHALL remain distinct from MPC payload signing. Existing `payload_signing_key`, `payload_public_key`, child keys, and MPC flows SHALL retain their roles. Consumer documentation SHALL identify missing `request_signing_key` as a breaking credential-format change and direct callers to create or export a credential whose matching public key is registered; editing an old export to insert an arbitrary private key SHALL NOT be presented as a migration.

#### Scenario: Payload signing after initialization

- **WHEN** an initialized client performs an existing MPC payload-signing operation
- **THEN** it uses its existing MPC payload keys and additionally authenticates any API-key HTTP request with the independent request key

#### Scenario: Migrating an old export

- **WHEN** a consumer follows the credential migration instructions
- **THEN** the instructions require a newly registered key or a valid export of an already registered request key, rather than reusing payload signing material
