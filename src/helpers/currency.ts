import { CurrencyAmount, Market, CurrencyPrice } from '../types'
import { CryptoCurrency } from '../constants/currency'
import { Market as MarketAuth } from '@neon-exchange/nash-protocol'

/* tslint:disable:interface-over-type-literal */
type MarketData = { [key: string]: MarketAuth }

/**
 *
 * @param amount
 * @param currency
 */
export function createCurrencyAmount(
  amount: string,
  currency: CryptoCurrency
): CurrencyAmount {
  return {
    amount,
    currency
  }
}

/**
 *
 * @param amount
 * @param currencyA
 * @param currencyB
 */
export function createCurrencyPrice(
  amount: string,
  currencyA: CryptoCurrency,
  currencyB: CryptoCurrency
): CurrencyPrice {
  return {
    amount,
    currencyA,
    currencyB
  }
}

/*
  Input: '1.0e-6' | '0.000001'
  Output: 6
 */
export const getPrecisionFromMarketString = (exp: string): number => {
  let stringValue: string = exp
  if (exp.indexOf('e') > -1) {
    // coerce to number to deal with scientific notation
    const numberValue: number = +exp
    // now back to string. this is so dirty
    stringValue = numberValue + ''
  }

  const split = stringValue.split('.')
  if (split.length === 1) {
    return 0
  }
  return split[1].length
}

/**
 * Normalizes the given amount based on the given trade size.
 *
 * @param amount
 * @param tradeSize
 */
export function normalizeAmountForMarketPrecision(
  amount: string,
  tradeSize: number
): string {
  const amountSplit = amount.split('.')

  if (tradeSize === 0) {
    if (amountSplit.length === 1) {
      return amountSplit[0]
    } else {
      throw new Error(
        `to many decimals given expected: ${tradeSize} got ${amountSplit[1].length}`
      )
    }
  }

  if (amountSplit.length === 1) {
    const head = amountSplit[0]
    const tail = ''.padStart(tradeSize, '0')
    return head + '.' + tail
  }

  if (amountSplit[1].length < tradeSize) {
    const head = amountSplit[0]
    const tail = ''.padStart(tradeSize - amountSplit[1].length, '0')
    return head + '.' + amountSplit[1] + tail
  }

  if (amountSplit[1].length > tradeSize) {
    return amountSplit[0] + '.' + amountSplit[1].substring(0, tradeSize)
  }

  return amount
}

export function normalizeAmountForMarket(
  amount: CurrencyAmount,
  market: Market
): CurrencyAmount {
  let precision = getPrecisionFromMarketString(market.minTradeIncrement)
  let minAmount = market.minTradeSize

  if (amount.currency === market.bUnit) {
    precision = getPrecisionFromMarketString(market.minTradeIncrementB)
    minAmount = market.minTradeSizeB
  }

  let normalizedAmount = normalizeAmountForMarketPrecision(
    amount.amount,
    precision
  )
  if (normalizedAmount.substr(-1) === '.') {
    normalizedAmount = normalizedAmount.slice(0, -1)
  }

  if (parseFloat(normalizedAmount) < parseFloat(minAmount)) {
    console.warn(
      `Amount ${normalizedAmount} for currency ${amount.currency} is less than min amount for market: ${minAmount}.  Defaulting to min amount`
    )
    normalizedAmount = normalizeAmountForMarketPrecision(
      minAmount + '',
      precision
    )
  }

  return createCurrencyAmount(normalizedAmount, amount.currency)
}

export function normalizePriceForMarket(
  price: CurrencyPrice,
  market: Market
): CurrencyPrice {
  let minTradeIncrementToUse = market.minTradeIncrement
  if (price.currencyA === market.bUnit) {
    minTradeIncrementToUse = market.minTradeIncrementB
  }

  const precision = getPrecisionFromMarketString(minTradeIncrementToUse)
  let normalizedPrice = normalizeAmountForMarketPrecision(
    price.amount,
    precision
  )
  if (normalizedPrice.substr(-1) === '.') {
    normalizedPrice = normalizedPrice.slice(0, -1)
  }

  return createCurrencyPrice(normalizedPrice, price.currencyA, price.currencyB)
}

export function mapMarketsForNashProtocol(markets: {
  [key: string]: Market
}): MarketData {
  const marketData = {}
  for (const it of Object.keys(markets)) {
    const market = markets[it]
    marketData[market.name] = {
      minTickSize: getPrecisionFromMarketString(market.minTickSize),
      minTradeSize: getPrecisionFromMarketString(market.minTradeSize),
      minTradeIncrementA: getPrecisionFromMarketString(
        market.minTradeIncrement
      ),
      minTradeIncrementB: getPrecisionFromMarketString(
        market.minTradeIncrementB
      )
    }
  }

  return marketData
}
