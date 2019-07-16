# api-client-typescript

Official TypeScript client for interacting with the Nash exchange.

## Getting Started

To install, download a release bundle, or install it from NPM:

    yarn add @neon-exchange/api-client-typescript

If you install it from a release bundle, make install the dependencies and run `yarn link`, in order to
use it just like the module from NPM:

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

Most of the Nash API requests require the client to be authenticated, this is needed to sign the payloads that are being send over the wire.

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
    console.log(e);
  }
};

run();
```

## For more function docs, see [`docs/classes/_client_client_.client.html`](./classes/_client_client_.client.html)
