import { CurrencyAmount, CurrencyPrice } from '../types'
import { CryptoCurrency } from '../constants/currency'

/**
 * 
 * @param amount 
 * @param currency 
 */
export function createCurrencyAmount(amount: string, currency: CryptoCurrency): CurrencyAmount {
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
export function createCurrencyPrice(amount: string, currencyA: CryptoCurrency, currencyB: CryptoCurrency): CurrencyPrice {
    return {
        amount,
        currencyA,
        currencyB
    }
} 