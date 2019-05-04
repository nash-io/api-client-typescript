# nash-api-client-ts

Official TypeScript client for interacting with the Nash exchange and Central Account Service.

## Installation

NPM

```
npm install @neon-exchange/api-client-ts --save
```

Yarn

```
yarn add @neon-exchange/api-client-ts
```

## Usage

```typescript
import { Client } from '@neon-exchange/api-client-ts';

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
import { Client, CryptoCurrency } from '@neon-exchange/api-client-ts';

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
  } catch (e) {
    console.log(e);
  }

  const balance = await nash.getAccountBalance(CryptoCurrency.NEO);
  console.log(balance);
};

run();
```
