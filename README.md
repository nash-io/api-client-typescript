# api-client-typescript

Official TypeScript client for interacting with the Nash Exchange.

To test your integrations, Nash provides a public sandbox environment at https://app.sandbox.nash.io. When creating an account on the sandbox, use the referral code `DEMORC`.

NOTE: In the sandbox, testnet funds are sent to new accounts automatically. The environment is automatically reset every four days.

```typescript
  apiURI: 'https://app.sandbox.nash.io/api',
  casURI: 'https://app.sandbox.nash.io/api/graphql'
```

## Getting started

To install, download a release bundle or install it from NPM:

    yarn add @neon-exchange/api-client-typescript

If you install it from a release bundle (or Git), install the dependencies and run `yarn link` in order to use it just like the module from NPM:

  unzip api-client-ts-task-bundle.zip
  cd api-client-ts-task-bundle
  yarn install
  yarn link
  cd ..


## Usage

```typescript
import { Client } from '@neon-exchange/api-client-typescript';

const nash = new Client({
  apiURI: 'path_to_nash_api',
  casURI: 'path_to_nash_cas',
  debug: false
});

const markets = nash.listMarkets();
console.log(markets);
```

## Authentication

Most Nash API requests require the client to be authenticated. This is needed to sign the payloads being sent over the wire.

```typescript
import { Client, CryptoCurrency } from '@neon-exchange/api-client-typescript';

const nash = new Client({
  apiURI: 'path_to_nash_api',
  casURI: 'path_to_nash_cas',
  debug: false
});

const email = 'user@email.com';
const password = 'userpassword';

const run = async () => {
  try {
    await nash.login(email, password);

    const balance = await nash.getAccountBalance(CryptoCurrency.NEO);
    console.log(balance);
  } catch (e) {
    console.error(e);
  }
};

run();
```

## For more function documentation, see [`docs/classes/_client_client_.client.html`](./classes/_client_client_.client.html)
