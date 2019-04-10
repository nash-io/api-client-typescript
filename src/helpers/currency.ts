import { CurrencyAmount, CurrencyPrice } from '../types';
import { CryptoCurrency } from '../constants/currency';

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
  };
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
  };
}

/*
  Input: '1.0e-6' | '0.0001
  Output: 6
  Zero is special case because log10(0) is -Infinity
 */
export const getPrecision = (exp: string): number =>
  +exp === 0 ? 0 : Math.abs(Math.log10(+exp));

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
  const amountSplit = amount.split('.');

  if (tradeSize === 0) {
    if (amountSplit.length === 1) {
      return amountSplit[0];
    } else {
      throw new Error(
        `to many decimals given expected: ${tradeSize} got ${
          amountSplit[1].length
        }`
      );
    }
  }

  if (amountSplit.length === 1) {
    const head = amountSplit[0];
    const tail = ''.padStart(tradeSize, '0');
    return head + '.' + tail;
  }

  if (amountSplit[1].length < tradeSize) {
    const head = amountSplit[0];
    const tail = ''.padStart(tradeSize - amountSplit[1].length, '0');
    return head + '.' + amountSplit[1] + tail;
  }

  if (amountSplit[1].length > tradeSize) {
    return amountSplit[0] + '.' + amountSplit[1].substring(0, tradeSize);
  }

  return amount;
}
