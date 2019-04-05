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
