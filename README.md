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

## Example

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

## The following API calls are implemented

## Central account service

- [x] login

## Queries

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
