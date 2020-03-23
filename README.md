# api-client-typescript

Official TypeScript client for interacting with the Nash Exchange.

To test your integrations, Nash provides a public sandbox environment at https://app.sandbox.nash.io.

NOTE: In the sandbox, testnet funds are sent to new accounts automatically. The environment is automatically reset every four days.

## Getting started

For the MPC version, we use this package: https://www.npmjs.com/package/@neon-exchange/api-client-typescript-mpc

Install it from NPM:

    yarn add @neon-exchange/api-client-typescript-mpc

## Usage

```typescript
import {
  Client,
  EnvironmentConfiguration
} from '@neon-exchange/api-client-typescript-mpc'

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
} from '@neon-exchange/api-client-typescript-mpc'

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

## Websockets

You can use websockets subscriptions like this:

```typescript
import {
  Client,
  EnvironmentConfiguration
} from '@neon-exchange/api-client-typescript-mpc'

const nash = new Client(EnvironmentConfiguration.sandbox)
await nash.login(require('PATH_TO_KEY.json'))

const connection = nash.createSocketConnection()

// Getting the orderbook for the neo_eth marked
connection.onUpdatedOrderbook(
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
connection.onUpdatedAccountOrders(
  {},
  {
    onResult: ({ data: { updatedAccountOrders } }) => {
      console.log(`Updated orders: {updatedAccountOrders.length}`)
    }
  }
)
```

## For more function documentation, see [`docs/classes/_client_client_.client.html`](./classes/_client_client_.client.html)
