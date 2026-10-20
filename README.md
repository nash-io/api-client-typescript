# api-client-typescript

Official TypeScript client for interacting with the [Nash Exchange](https://nash.io/).

- [Github repository](https://github.com/nash-io/api-client-typescript)
- [Documentation](https://nash-io.github.io/api-client-typescript)

To test your integrations, Nash provides a public sandbox environment at https://app.sandbox.nash.io.

NOTE: In sandbox, testnet funds are automatically sent to new accounts. The sandbox environment is reset every couple of days.

## Installation

Requires usage of Node 14 or greater.

```sh
yarn add @neon-exchange/api-client-typescript
```

## Getting started

To get started you need to create an API key. You can find instructions on how to do so further down in this Readme.
Remember, API Keys contain sensitive infomation, if you are using version control be careful not to store the key in the repository.

## API Compatibility

Versions 6 and above include a change to order placement logic. The previous order placement logic will no longer be compatible with the exchange, so it is highly recommended to upgrade to version 6 or higher as previous versions will be deprecated.


## Usage

```typescript
import {
  Client,
  EnvironmentConfiguration
} from '@neon-exchange/api-client-typescript'

const nash = new Client(EnvironmentConfiguration.sandbox)

const run = async () => {
  const markets = await nash.listMarkets()
  console.log(markets)
}

run()
```

Note: You can use either `EnvironmentConfiguration.production` or `EnvironmentConfiguration.sandbox`.

## Authentication

Most Nash API requests require the client to be authenticated. This is needed to sign the payloads being sent over the wire.

```typescript
import {
  Client,
  EnvironmentConfiguration,
  CryptoCurrency
} from '@neon-exchange/api-client-typescript'

const nash = new Client(EnvironmentConfiguration.sandbox)

const run = async () => {
  try {
    await nash.login(require('PATH_TO_KEY.json'))
    const balance = await nash.getAccountBalance(CryptoCurrency.NEO)
    console.log(balance)
  } catch (e) {
    console.error(e)
  }
}

run()
```

## Nash Rails API

`client.rails` talks to the Rails REST service separately from GraphQL and websockets. Configure `railsApiUrl` with the complete versioned base path for the same deployment; the SDK does not infer it from the GraphQL host:

```typescript
import {
  Client,
  EnvironmentConfiguration,
  RailsApiError
} from '@neon-exchange/api-client-typescript'

const client = new Client({
  ...EnvironmentConfiguration.dev1,
  railsApiUrl: 'https://rails.sandbox.nash.io/rails/api/v1'
})

await client.login({
  apiKey: process.env.NASH_API_KEY!,
  secret: process.env.NASH_API_SECRET!
})

const openApi = await client.rails.getOpenApi()
const customer = await client.rails.createCustomer(
  { email: 'customer@example.test', countryCode: 'NL' },
  { idempotencyKey: 'customer-create-1' }
)
await client.rails.getCustomer(customer.id)

try {
  await client.rails.getPartner()
} catch (error) {
  if (error instanceof RailsApiError) {
    console.error(error.status, error.code, error.backendMessage, error.details)
  }
}
```

MPC Rails requests require an API-key login and a registered `request_signing_key`. Create replacement credentials with `Client.createApiKey(...)` before migrating; its secret includes the matching key registered during creation. Existing secrets without that key are rejected before network traffic. Do not edit a legacy secret to add an arbitrary private key. Keep the new secret private and revoke the old API key separately after migration.

Rails API keys need the scopes required by each operation. `getOpenApi()` is public. Partner operations such as `getPartner()` and `listCustomers()` use partner authorization; customer-resource methods send that resource's ID in `nash-customer-id`. A `customer_id` filter on `listOrders()` is a filter, not an authorization context.

For document uploads, call `submitComplianceDocuments(customerId, requestId, documents)` with `Buffer` data, filenames, and optional MIME types. The SDK buffers the multipart body to sign its exact bytes and SHA-256 digest. State-changing calls accept `RailsRequestOptions.idempotencyKey`, forwarded as `Idempotency-Key`; reusing the same key for the same request replays the prior result, while changing request data may be rejected by the backend. Monetary inputs and wire amounts are decimal strings, not JavaScript numbers. `RailsApiError` exposes HTTP `status`, stable `code`, `backendMessage`, and sanitized `details`; its `.message` does not echo arbitrary backend text.



## Nodejs usage

Using the client in node can be done like below. See also the [nodejs example](https://github.com/nash-io/api-client-typescript/tree/master/examples/nodejs).

```javascript
const Nash = require('@neon-exchange/api-client-typescript')

const client = new Nash.Client(Nash.EnvironmentConfiguration.production)

const apiKeys = {
  secret: 'your secret',
  apiKey: 'your key'
}

const run = async () => {
  try {
    await client.login(apiKeys)
  } catch (e) {
    console.log(e)
  }
}

run()
```

## Websockets

You can use websockets subscriptions like this:

```javascript

import { Client, EnvironmentConfiguration } from '@neon-exchange/api-client-typescript'

const nash = new Client(EnvironmentConfiguration.sandbox)
await nash.login(...)

// Getting the orderbook for the neo_eth marked
nash.subscriptions.onUpdatedOrderbook(
  { marketName: 'neo_eth' },
  {
    onResult: ({
      data: {
        updatedOrderBook: { bids, asks }
      }
    }) => {
      console.log(`updated bids ${bids.length}`)
      console.log(`updated asks ${asks.length}`)
    }
  }
)

// Getting the user orderobok for all markets
nash.subscriptions.onUpdatedAccountOrders(
  {},
  {
    onResult: ({
      data: {
        updatedAccountOrders
      }
    }) => {
      console.log(`Updated orders: {updatedAccountOrders.length}`)
    }
  }
)

```

## Using affiliate codes

To configure the client to use an affiliate code, you just have to supply it as a client option.

```javascript
import { Client } from '@neon-exchange/api-client-typescript'

const client = new Client(
  ...,
  {
    affiliateCode: 'YOUR_CODE',
    affiliateLabel: 'arbitragebot' // Optional label
  }
)
```

You may supply an optional affiliate label, which will be shown on the affiliate page. Label may only contain alpha numeric characters.

---

## Setting up API keys

Setting up an API key is very easy. Start by navigating to your profile page, from the profile page, click on the API Keys tab, and click on the 'Generate new key' to open a create API Key wizard.
After going through the wizard. Remember to save your API key, and store it somewhere accessible to your project.

[This video](https://youtu.be/5DQ0PCbCwkI) shows how to set up a new API Key.

## API key policies & transferring funds to external wallets

Using API keys allows users to apply policies to operations performed by the SDK. One such operation is to transfer funds to external accounts. This is done by using the transferToExternal method on the Client.
Before being allowed to send funds, addresses have to be explicitly whitelisted. Otherwise the all calls to the method will result in a permission violation.

Whitelisted addresses can be set up both before and after creating the API key. [This video](https://youtu.be/5hAa3FqknFA) shows how to whitelist two addresses for an API key.

## State signing

In order to assure your blockchain balances remain in sync with your trading balances, the client must 'sign' their state every so often before placing more orders. By default, the client will take care of this in the background for you and you will not need to worry about this.

In special cases where a user has more than one client process running at once which is placing a high volume of orders, it is advisable to take a more custom approach. To turn of auto state syncing, initialize the client like so:

```
const nash = new Client(EnvironmentConfiguration.sandbox, {autoSignState: false})
```

You will then be responsible for signing states when necessary. The current restriction is that states must be signed every 100 open orders, so the client should keep track and make sure to sign state before this limit is reached, otherwise placing an order will raise an error.

This is done using the following call:

```
const states = await client.getSignAndSyncStates()
```

If you are running a high volume of orders from different clients on the same account and having difficulty managing this process, please reach out to support and we will be glad to help with an optimal solution.
