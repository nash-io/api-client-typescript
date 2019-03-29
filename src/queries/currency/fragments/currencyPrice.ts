import gql from 'graphql-tag'
import { CryptoCurrency } from '../../../constants/currency'

export interface CurrencyPrice {
    amount: string
    currencyA: CryptoCurrency
    currencyB: CryptoCurrency
}

export const CURRENCY_PRICE_FRAGMENT = gql`
  fragment currencyPriceFields on CurrencyPrice {
    amount
    currencyA
    currencyB
  }
`