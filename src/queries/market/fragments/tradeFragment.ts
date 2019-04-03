import gql from 'graphql-tag'

import {
  CURRENCY_PRICE_FRAGMENT,
  CURRENCY_AMOUNT_FRAGMENT,
} from '../../../queries/currency/fragments'

import {
  CurrencyAmount,
  CurrencyPrice
} from '../../../types'

export interface Trade {
  id: string
  executedAt: string
  limitPrice: CurrencyPrice
  amount: CurrencyAmount
}

export const TRADE_FRAGMENT = gql`
  fragment tradeFields on Trade {
    id
    executedAt
    limitPrice {
      ...currencyPriceFields
    }
    amount {
      ...currencyAmountFields
    }
  }
  ${CURRENCY_PRICE_FRAGMENT}
  ${CURRENCY_AMOUNT_FRAGMENT}
`