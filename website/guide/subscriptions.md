# Subscriptions

Use `client.subscriptions` for websocket updates. The connection is created lazily; account subscriptions require a successful [API-key login](./authentication.md).

This helper uses an already authenticated client:

```typescript
import { Client } from '@neon-exchange/api-client-typescript'

export async function observeAccountOrders(client: Client) {
  await client.subscriptions.onUpdatedAccountOrders({}, {
    onResult: ({ data: { updatedAccountOrders } }) => {
      console.log(updatedAccountOrders)
    },
    onError: error => console.error(error)
  })
}
```

Public market subscriptions do not all use the same transport: `onUpdatedOrderbook` joins a raw Phoenix channel, while other subscription handlers use Absinthe. Consult each handler's payload and callback types instead of assuming every subscription has the same shape.

Call `client.disconnect()` when the connection is no longer needed. Setting `runRequestsOverWebsockets` is separate from subscribing: it routes ordinary authenticated exchange requests through the socket instead of HTTP. Leave it unset unless you need that behavior.

See [NashSocketEvents](../api/index/interfaces/NashSocketEvents.md) for the full subscription inventory and [ClientOptions](../api/client/environments/interfaces/ClientOptions.md) for connection options.
