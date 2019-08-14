import {
  createCurrencyAmount,
  createCurrencyPrice,
  normalizeAmountForMarket,
  normalizePriceForMarket,
  normalizeAmountForMarketPrecision
} from '../helpers';
import { CryptoCurrency } from '../constants/currency';
import { MarketStatus } from '../types';

const market = {
  aUnit: CryptoCurrency.NEO,
  aUnitPrecision: 2,
  bUnit: CryptoCurrency.GAS,
  bUnitPrecision: 8,
  minTickSize: '1.0e-6',
  minTradeSize: '0.01',
  minTradeSizeB: '0.01',
  name: 'neo_gas',
  status: MarketStatus.RUNNING,
  minTradeIncrement: '6',
  minTradeIncrementB: '6'
};

test('normalizes the amount according to the given trade size', async () => {
  expect(normalizeAmountForMarketPrecision('10', 2)).toBe('10.00');
  expect(normalizeAmountForMarketPrecision('10.001', 2)).toBe('10.00');
  expect(normalizeAmountForMarketPrecision('10.001', 6)).toBe('10.001000');
});

test('normalizes currency amount', async () => {
  const currencyAmount = createCurrencyAmount('1', CryptoCurrency.NEO);
  const result = normalizeAmountForMarket(currencyAmount, market);
  expect(result.amount).toBe('1.00');
});

test('normalizes currency price', async () => {
  const currencyPrice = createCurrencyPrice(
    '0.01',
    CryptoCurrency.GAS,
    CryptoCurrency.GAS
  );
  const result = normalizePriceForMarket(currencyPrice, market);
  expect(result.amount).toBe('0.010000');
});
