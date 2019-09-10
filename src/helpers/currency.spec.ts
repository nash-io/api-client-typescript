import {
  createCurrencyAmount,
  createCurrencyPrice,
  normalizeAmountForMarket,
  normalizePriceForMarket,
  normalizeAmountForMarketPrecision,
  getPrecisionFromMarketString
} from '../helpers'
import { CryptoCurrency } from '../constants/currency'
import { Market } from '../types'
import { defaultMarkets } from '../helpers/markets.default'

const neo_gas = defaultMarkets.neo_gas as Market

// neo_gas: {
//   aUnit: 'neo',
//   aUnitPrecision: 5,
//   bUnit: 'gas',
//   bUnitPrecision: 5,
//   minTickSize: '0.01',
//   minTradeIncrement: '0.001',
//   minTradeIncrementB: '0.01',
//   minTradeSize: '0.50000',
//   minTradeSizeB: '1.00000',
//   name: 'neo_gas',
//   priceGranularity: 12,
//   status: 'RUNNING'
// },

test('normalizes the amount according to the given trade size', async () => {
  expect(normalizeAmountForMarketPrecision('10', 2)).toBe('10.00')
  expect(normalizeAmountForMarketPrecision('10.001', 2)).toBe('10.00')
  expect(normalizeAmountForMarketPrecision('10.001', 6)).toBe('10.001000')
})

test('get precision works as expected', async () => {
  expect(getPrecisionFromMarketString('0.01')).toBe(2)
  expect(getPrecisionFromMarketString('0.001')).toBe(3)
  expect(getPrecisionFromMarketString('10')).toBe(0)
  expect(getPrecisionFromMarketString('1')).toBe(0)
  expect(getPrecisionFromMarketString('0')).toBe(0)
  expect(getPrecisionFromMarketString('0.50000')).toBe(5)
  expect(getPrecisionFromMarketString('1.0e-6')).toBe(6)
  expect(getPrecisionFromMarketString('1.0e+6')).toBe(0)
  expect(getPrecisionFromMarketString('125.2569782548')).toBe(10)
})

test('normalizes currency amount', async () => {
  let currencyAmount = createCurrencyAmount('1', CryptoCurrency.NEO)
  let result = normalizeAmountForMarket(currencyAmount, neo_gas)
  expect(result.amount).toBe('1.000')

  currencyAmount = createCurrencyAmount('50', CryptoCurrency.GAS)
  result = normalizeAmountForMarket(currencyAmount, neo_gas)
  expect(result.amount).toBe('50.00')

  // lower than min amount for gas should be set to min amount
  currencyAmount = createCurrencyAmount('.1', CryptoCurrency.GAS)
  result = normalizeAmountForMarket(currencyAmount, neo_gas)
  expect(result.amount).toBe('1.00')

  // same for neo
  currencyAmount = createCurrencyAmount('.1', CryptoCurrency.NEO)
  result = normalizeAmountForMarket(currencyAmount, neo_gas)
  expect(result.amount).toBe('0.500')
})

test('normalizes currency price', async () => {
  // use minTradeIncrement ( which is 0.001)
  let currencyPrice = createCurrencyPrice(
    '0.01',
    CryptoCurrency.NEO,
    CryptoCurrency.GAS
  )
  let result = normalizePriceForMarket(currencyPrice, neo_gas)
  expect(result.amount).toBe('0.010')

  // for gas it is 0.01
  // so normalizePriceForMarket needs to use minTradeIncrementB
  currencyPrice = createCurrencyPrice(
    '0.01',
    CryptoCurrency.GAS,
    CryptoCurrency.NEO
  )
  result = normalizePriceForMarket(currencyPrice, neo_gas)
  expect(result.amount).toBe('0.01')
})
