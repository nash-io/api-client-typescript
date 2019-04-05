import { Client } from '../client';
import { CryptoCurrency } from '../constants/currency';
import { createCurrencyAmount, createCurrencyPrice } from '../helpers';
import {
  OrderBuyOrSell,
  OrderStatus,
  OrderCancellationPolicy,
  MovementStatus
} from '../types';

const client = new Client();

beforeAll(async () => {
  const email = 'test@nash.io';
  const password =
    'af0782580bb2ec65b72cb184cf729dd16dfd5669ae247c64aa8d6d01b6ed8a34';

  await client.login(email, password);
});

test('successfull logs in a user', async () => {
  const email = 'test@nash.io';
  const password =
    'af0782580bb2ec65b72cb184cf729dd16dfd5669ae247c64aa8d6d01b6ed8a34';

  await expect(client.login(email, password)).resolves.toBeTruthy;
});

test('unsuccessfully logs in a user with invalid credentials', async () => {
  const email = 'test_invalid@nash.io';
  const password =
    'af0782580bb2ec65b72cb184cf729dd16dfd5669ae247c64aa8d6d01b6ed8a34';

  await expect(client.login(email, password)).rejects.toThrow(Error);
});

test('get ticker', async () => {
  const ticker = await client.getTicker('neo_gas');

  console.log(ticker);
});

test('get orderbook', async () => {
  const orderBook = await client.getOrderBook('neo_gas');

  console.log(orderBook);
});

test('list trades', async () => {
  const tradeHistory = await client.listTrades('neo_gas');

  console.log(tradeHistory);
});

test('list tickers', async () => {
  const tickers = await client.listTickers();

  expect(tickers.length).toBeGreaterThan(0);
});

test('list candles', async () => {
  const candleRange = await client.listCandles('neo_eth');

  expect(candleRange.candles).toHaveLength(0);
});

test('list all available markets', async () => {
  const markets = await client.listMarkets();
  expect(markets).toHaveLength(4);
});

test('get a valid market', async () => {
  const market = await client.getMarket('eth_neo');
  expect(market).toBeDefined();
});

test('get a non-existing market throws error', async () => {
  await expect(client.getMarket('ETH_NASH')).rejects.toThrow(Error);
});

test('list account transactions', async () => {
  const accountTransactionResponse = await client.listAccountTransactions();
  expect(accountTransactionResponse.transactions).toHaveLength(0);
});

test('list account balances', async () => {
  const accountBalances = await client.listAccountBalances();
  expect(accountBalances.length).toBeGreaterThan(0);
});

test('get deposit address', async () => {
  const depositAddress = await client.getDepositAddress(CryptoCurrency.ETH);
  expect(depositAddress.currency).toBe('eth');
  expect(depositAddress.address).toBeDefined();
});

test('get account portfolio', async () => {
  const accountPortfolio = await client.getAccountPortfolio();
  expect(accountPortfolio.balances.length).toBeGreaterThan(0);
});

test('get movement that not exist throws', async () => {
  await expect(client.getMovement(1)).rejects.toThrow(Error);
});

test('get account balance', async () => {
  const accountBalance = await client.getAccountBalance(CryptoCurrency.GAS);
  console.log(accountBalance);
  expect(accountBalance.available.amount).toBeDefined();
});

test('get account order that not exist throws', async () => {
  await expect(client.getAccountOrder('1')).rejects.toThrow(Error);
});

test('list account volumes', async () => {
  const accountVolumes = await client.listAccountVolumes();
  expect(accountVolumes.volumes).toHaveLength(2);
});

test('place limit order', async () => {
  const orderPlaced = await client.placeLimitOrder(
    false,
    createCurrencyAmount('10', CryptoCurrency.NEO),
    OrderBuyOrSell.SELL,
    OrderCancellationPolicy.GOOD_TIL_CANCELLED,
    createCurrencyPrice('8.5', CryptoCurrency.GAS, CryptoCurrency.NEO),
    'neo_gas'
  );

  expect(orderPlaced.status).toBe(OrderStatus.PENDING);
});

test('place market order', async () => {
  const orderPlaced = await client.placeMarketOrder(
    createCurrencyAmount('1', CryptoCurrency.NEO),
    OrderBuyOrSell.SELL,
    'neo_gas'
  );

  expect(orderPlaced.status).toBe(OrderStatus.PENDING);
});

test('place stop limit order', async () => {
  const orderPlaced = await client.placeStopLimitOrder(
    false,
    createCurrencyAmount('1', CryptoCurrency.NEO),
    OrderBuyOrSell.BUY,
    OrderCancellationPolicy.GOOD_TIL_CANCELLED,
    createCurrencyPrice('2', CryptoCurrency.GAS, CryptoCurrency.NEO),
    'neo_gas',
    createCurrencyPrice('3', CryptoCurrency.GAS, CryptoCurrency.NEO)
  );

  expect(orderPlaced.status).toBe(OrderStatus.PENDING);
});

test('place stop market order', async () => {
  const orderPlaced = await client.placeStopMarketOrder(
    createCurrencyAmount('2', CryptoCurrency.NEO),
    OrderBuyOrSell.SELL,
    'neo_gas',
    createCurrencyPrice('1', CryptoCurrency.GAS, CryptoCurrency.NEO)
  );

  expect(orderPlaced.status).toBe(OrderStatus.PENDING);
});

test('sign deposit request', async () => {
  const address = 'd5480a0b20e2d056720709a9538b17119fbe9fd6';
  const amount = createCurrencyAmount('1.4', CryptoCurrency.ETH);
  const signMovement = await client.signDepositRequest(address, amount);

  const movements = await client.listMovements();
  expect(movements.length).toBeGreaterThan(0);

  expect(signMovement.movement.status).toBe(MovementStatus.PENDING);
});

test('sign withdraw request', async () => {
  const address = 'd5480a0b20e2d056720709a9538b17119fbe9fd6';
  const amount = createCurrencyAmount('1.5', CryptoCurrency.ETH);
  const signMovement = await client.signWithdrawRequest(address, amount);

  const movements = await client.listMovements();
  expect(movements.length).toBeGreaterThan(0);

  expect(signMovement.movement.status).toBe(MovementStatus.PENDING);
});

// PENDING orders cannot be canceled
// test('cancel order', async () => {
//     const orderPlaced = await client.placeMarketOrder(
//         createCurrencyAmount('1', CryptoCurrency.NEO),
//         OrderBuyOrSell.SELL,
//         'neo_gas'
//     )

//     const cancelledOrder = await client.cancelOrder(orderPlaced.id)
//     console.log(cancelledOrder)
// })
