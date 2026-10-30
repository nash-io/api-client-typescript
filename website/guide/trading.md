# Trading

[Authenticate](./authentication.md) before placing or cancelling orders. Read `listMarkets()` and select an available sandbox market first. Order placement can execute trades and spend funds; the example below places a real sandbox limit order if called with valid credentials and market inputs.

Amounts and prices are decimal **strings**, never JavaScript numbers. Use the SDK helpers and honor the selected market's minimum sizes and precision.

```typescript
import {
  Client,
  CryptoCurrency,
  createCurrencyAmount,
  createCurrencyPrice,
  OrderBuyOrSell,
  OrderCancellationPolicy
} from '@neon-exchange/api-client-typescript'

export async function placeSandboxLimitOrder(
  client: Client,
  marketName: string,
  base: CryptoCurrency,
  quote: CryptoCurrency,
  amount: string,
  price: string
) {
  return client.placeLimitOrder(
    false,
    createCurrencyAmount(amount, base),
    OrderBuyOrSell.BUY,
    OrderCancellationPolicy.GOOD_TIL_CANCELLED,
    createCurrencyPrice(price, quote, base),
    marketName
  )
}
```

The client must already be logged into sandbox; the helper does not enforce the environment. Price is expressed in quote currency per base currency. The SDK normalizes order inputs using market precision, so inspect the actual market constraints before submitting. Track the returned order ID and status; use `cancelOrder(orderId, marketName)` to cancel an open order.

## State signing

Keep `autoSignState` enabled (the default) unless coordinating account state across multiple clients yourself. Disabling it makes you responsible for calling `getSignAndSyncStates()` before the exchange's state-signing limit is reached. Do not remove the SDK's nonce refresh or state-sync behavior when wrapping order methods.

Batch methods support at most 17 operations per synthesized mutation. Handle partial/error results according to their generated return types; do not assume a batch is atomic.

See [Client order methods](../api/index/classes/Client.md#placelimitorder), [OrderPlaced](../api/index/interfaces/OrderPlaced.md), and [subscriptions](./subscriptions.md) for updates.
