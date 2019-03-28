import gql from 'graphql-tag'
import { CryptoCurrency } from '../../../constants/currency'

export interface CurrencyAmount {
    amount: string
    currency: CryptoCurrency
}

export const CURRENCY_AMOUNT_FRAGMENT = gql`
  fragment currencyAmountFields on CurrencyAmount {
    amount
    currency
  }
`