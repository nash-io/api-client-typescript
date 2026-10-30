# Getting started

## Installation

The published SDK declares Node >=14.3. Use a supported Node release for new integrations; contributing and building this repository uses Node 24 and Yarn 1.22.22. On macOS, install GMP first (`brew install gmp`).

```sh
yarn add @neon-exchange/api-client-typescript
```

## Your first request

Market reads do not require credentials:

```typescript
import { Client, EnvironmentConfiguration } from '@neon-exchange/api-client-typescript'

async function main() {
  const client = new Client(EnvironmentConfiguration.sandbox)
  const markets = await client.listMarkets()
  console.log(markets)
}

main().catch(console.error)
```

Use the returned market names, supported assets, and precision/minimum constraints rather than assuming a historical market still exists. `EnvironmentConfiguration.production` selects the production exchange; do not use production for experiments that place orders or move funds.

For CommonJS, replace the import with:

```javascript
const { Client, EnvironmentConfiguration } = require('@neon-exchange/api-client-typescript')
```

The SDK uses separate GraphQL, websocket, and Rails REST transports. Exchange presets do not automatically configure the Rails base URL. See [Rails](./rails.md) before using `client.rails`.

Next: [authenticate](./authentication.md), then use the [Client reference](../api/index/classes/Client.md).
