# Authentication

Private exchange requests and authenticated Rails requests require an API-key login. Create credentials for the intended environment and scopes; store secrets outside source control.

```typescript
import { Client, EnvironmentConfiguration } from '@neon-exchange/api-client-typescript'

async function main() {
  const apiKey = process.env.NASH_API_KEY
  const secret = process.env.NASH_API_SECRET
  if (!apiKey || !secret) throw new Error('Set NASH_API_KEY and NASH_API_SECRET')

  const client = new Client(EnvironmentConfiguration.sandbox)
  await client.login({ apiKey, secret })
  console.log(await client.listAccountBalances(false))
}

main().catch(console.error)
```

`secret` is the exported base64-encoded credential, not a raw private key. It must contain MPC fields and a registered `request_signing_key`. The SDK rejects malformed and legacy credentials locally before replacing the session or sending initialization traffic.

For legacy secrets without that key, create replacement credentials through `Client.createApiKey(...)` using the required account session. Never append an arbitrary private key to an old secret: its public key must be registered with the service. Revoke old credentials separately after migrating.

`login` initializes exchange markets, assets, and nonces; it is not just an offline credential setter. Select the correct exchange environment even when subsequently using Rails. Prefer API-key login over the legacy password login, which derives account private keys and has different capabilities.

See [login](../api/index/classes/Client.md#login) and [Rails authorization](./rails.md#authorization).
