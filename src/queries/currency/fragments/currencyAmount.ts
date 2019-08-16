import gql from 'graphql-tag'

import { CryptoCurrency, FiatCurrency } from '../../../constants/currency'

export interface FiatCurrencyAmount {
  amount: string
  currency: FiatCurrency
}

export interface CryptoCurrencyAmount {
  amount: string
  currency: CryptoCurrency
}

export type CurrencyAmount = CryptoCurrencyAmount | FiatCurrencyAmount

export const CURRENCY_AMOUNT_FRAGMENT = gql`
  fragment currencyAmountFields on CurrencyAmount {
    amount
    currency
  }
`
