# nash-api-client-ts

Official TypeScript client for interacting with the Nash exchange

## Installation

`yarn install`

## Test

`yarn test`

> Note that this requires to have a local backend setup and running.

## Configuration

You can configure the endpoints of the GQL server and central account service

- `GQL_URL`
- `CAS_URL`

#### example

`export GQL_URL='http://localhost:3000'`
`export CAS_URL='http://localhost:4000'`

## Starter example

```typescript
import {
  Client,
  OrderBuyOrSell,
  createCurrencyAmount,
  CryptoCurrency
} from '@neon-exchange/api-client-ts';

const client = new Client();

// Login against the CAS
const email = 'user@example.com';
const password = 'flkdnvbuieladf5d6d54';
await client.login(email, password);

// Placing a market order
const orderPlaced = await client.placeMarketOrder(
  createCurrencyAmount('1', CryptoCurrency.NEO),
  OrderBuyOrSell.SELL,
  'neo_gas'
);

console.log(orderPlaced);

// Listing account balances
const accountBalances = await client.listAccountBalances();

console.log(accountBalances);
```

## Placing orders

### market order

```typescript
import {
  Client,
  OrderBuyOrSell,
  createCurrencyAmount,
  CryptoCurrency
} from '@neon-exchange/api-client-ts';

const client = new Client();

try {
  await client.login('email', 'password');
} catch (e) {
  // handle the error.
}

const orderPlaced = await client.placeMarketOrder(
  createCurrencyAmount('1.00', CryptoCurrency.NEO),
  OrderBuyOrSell.SELL,
  'neo_gas'
);

console.log(orderPlaced.status);
```

### limit order

```typescript
import {
  Client,
  OrderBuyOrSell,
  createCurrencyAmount,
  createCurrencyPrice,
  CryptoCurrency,
  OrderCancellationPolicy
} from '@neon-exchange/api-client-ts';

const client = new Client();

try {
  await client.login('email', 'password');
} catch (e) {
  // handle the error.
}

const orderPlaced = await client.placeLimitOrder(
  false,
  createCurrencyAmount('1.00', CryptoCurrency.NEO),
  OrderBuyOrSell.SELL,
  OrderCancellationPolicy.GOOD_TIL_CANCELLED,
  createCurrencyPrice('0.01', CryptoCurrency.GAS, CryptoCurrency.NEO),
  'neo_gas'
);

console.log(orderPlaced.status);
```

### stop market order

```typescript
import {
  Client,
  OrderBuyOrSell,
  createCurrencyAmount,
  CryptoCurrency
} from '@neon-exchange/api-client-ts';

const client = new Client();

try {
  await client.login('email', 'password');
} catch (e) {
  // handle the error.
}

const orderPlaced = await client.placeStopMarketOrder(
  createCurrencyAmount('2.00', CryptoCurrency.NEO),
  OrderBuyOrSell.SELL,
  'neo_gas',
  createCurrencyPrice('1.00', CryptoCurrency.GAS, CryptoCurrency.NEO)
);

console.log(orderPlaced.status);
```

### stop limit order

```typescript
import {
  Client,
  OrderBuyOrSell,
  createCurrencyAmount,
  createCurrencyPrice,
  CryptoCurrency,
  OrderCancellationPolicy
} from '@neon-exchange/api-client-ts';

const client = new Client();

try {
  await client.login('email', 'password');
} catch (e) {
  // handle the error.
}

const orderPlaced = await client.placeStopLimitOrder(
  false,
  createCurrencyAmount('1.00', CryptoCurrency.NEO),
  OrderBuyOrSell.BUY,
  OrderCancellationPolicy.GOOD_TIL_CANCELLED,
  createCurrencyPrice('2.00', CryptoCurrency.GAS, CryptoCurrency.NEO),
  'neo_gas',
  createCurrencyPrice('3.00', CryptoCurrency.GAS, CryptoCurrency.NEO)
);

console.log(orderPlaced.status);
```

## The following API calls are implemented

## Central account service

- [x] login

## Queries

- [x] getTicker
- [x] getOrderBook
- [x] listTickers
- [x] listOrders
- [x] listTrades
- [x] listCandles
- [x] getMarket
- [x] getAccountPortfolio
- [x] getAccountBalance
- [x] getAccountOrder
- [x] getDepositAddress
- [x] getMovement
- [x] listMarkets
- [x] listMovements
- [x] listAccountOrders
- [x] listAccountTransactions
- [x] listAccountBalances
- [x] listAccountVolumes

## Mutations

- [x] cancelOrder
- [x] placeLimitOrder
- [x] placeMarketOrder
- [x] placeStopLimitOrder
- [x] placeStopMarketOrder
- [x] signDepositRequest
- [x] signWithdrawRequest

## TODO due to backend revisions

- [ ] cancelAllOrders
- [ ] syncStates
- [ ] getStates
