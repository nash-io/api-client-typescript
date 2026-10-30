# Nash Rails

`client.rails` is a REST API separate from Exchange GraphQL and websockets. Configure the complete versioned Rails URL explicitly, paired with the exchange deployment that issued the credentials:

```typescript
import { Client, EnvironmentConfiguration } from '@neon-exchange/api-client-typescript'

async function main() {
  const railsApiUrl = process.env.NASH_RAILS_API_URL
  if (!railsApiUrl) throw new Error('Set NASH_RAILS_API_URL for the sandbox deployment')

  const client = new Client({
    ...EnvironmentConfiguration.sandbox,
    railsApiUrl
  })
  console.log(await client.rails.getOpenApi())
}

main().catch(console.error)
```

Use HTTPS for remote services; HTTP is supported only for loopback development hosts. The exchange environment controls its own transport independently.

## Authorization

`getOpenApi()` is public. Other calls require [MPC API-key login](./authentication.md) with a registered request-signing key and the scopes required by the operation.

- Partner reads such as `getPartner()` and `listCustomers()` use partner authorization.
- Customer-resource methods bind the resource's customer ID into the signed `nash-customer-id` header.
- Account methods (wallet registration, bank verification, payment methods, and quotes) take a customer ID, or `null` to act as the partner itself using signed `nash-act-as: partner`.
- An order-list `customer_id` filter does not establish authorization context. Do not try to override signed context through request-option headers.

## Writes and errors

State-changing calls accept `RailsRequestOptions.idempotencyKey`. Reuse a key only for the same logical request and identical data. Idempotency does not disable replay protection: identical authenticated requests signed within the same second can be rejected as `replay_detected`.

Use decimal strings for monetary values. For uploads, supply `Buffer` data, filenames, and optional MIME types; the SDK buffers multipart bytes and signs their digest.

Catch `RailsApiError` to inspect `status`, `code`, `backendMessage`, and sanitized `details`. Its `.message` deliberately does not echo arbitrary backend response text. Do not log API secrets or signed transaction payloads.

## Fiat ramp and transactions

A quote binds `walletAddress` at creation. Supply exactly one decimal-string `fiatAmount` or `cryptoAmount`. Buy confirmation uses `{}`; deposit-sell confirmation uses `{ paymentMethodId }`, not another wallet address. Permit sells require a signature of the quote's raw `permitTransferDigest`; a wallet-ownership signature is not transfer authorization.

`client.rails.signPayload(...)` signs transaction payloads but does not submit them. Follow the prepare/iterate flow in the [Rails reference](../api/index/classes/RailsClient.md) and the deployment's [Rails integration guides](https://rails.sandbox.nash.io/dashboard/guides/quickstart). Local serialization/signing checks do not prove backend acceptance.

See [RailsClient](../api/index/classes/RailsClient.md), [RailsRequestOptions](../api/index/interfaces/RailsRequestOptions.md), and [RailsApiError](../api/index/classes/RailsApiError.md).
