# api-client-typescript

Official TypeScript client for interacting with the [Nash Exchange](https://nash.io/).

- [Gitlab repository](https://gitlab.com/nash-io-public/api-client-typescript)
- [Documentation](https://nash-io-public.gitlab.io/api-client-typescript) 
  - [`nash.Client` API reference](https://nash-io-public.gitlab.io/api-client-typescript/classes/_client_client_.client.html)

To test your integrations, Nash provides a public sandbox environment at https://app.sandbox.nash.io.

NOTE: In sandbox, testnet funds are automatically sent to new accounts. The sandbox environment is reset every couple of days.

## Installation

```sh
yarn add @neon-exchange/api-client-typescript
```

## Getting started

To get started you need to create an API key. You can find instructions on how to do so on our [wiki page](https://gitlab.com/nash-io-public/api-client-typescript/-/wikis/Setting-up-API-keys).

Remember, API Keys contain sensitive infomation, if you are using version control be careful not to store the key in the repository.

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

See also the [websockets example](https://gitlab.com/nash-io-public/api-client-typescript/-/tree/master/examples/sockets-orderbook).

## Managing API key policies

For more information on how to set up policies for API keys, consult the [API key policies wiki page](https://gitlab.com/nash-io-public/api-client-typescript/-/wikis/Apikey-policies).
