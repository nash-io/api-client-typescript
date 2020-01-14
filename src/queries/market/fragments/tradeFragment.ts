import gql from 'graphql-tag'

import {
  CURRENCY_PRICE_FRAGMENT,
  CURRENCY_AMOUNT_FRAGMENT
} from '../../../queries/currency/fragments'

export const TRADE_FRAGMENT = gql`
  fragment tradeFields on Trade {
    id
    makerOrderId
    takerOrderId
    executedAt
    accountSide
    limitPrice {
      ...currencyPriceFields
    }
    amount {
      ...currencyAmountFields
    }
    direction
    makerGave {
      ...currencyAmountFields
    }
    takerGave {
      ...currencyAmountFields
    }
    makerReceived {
      ...currencyAmountFields
    }
    takerReceived {
      ...currencyAmountFields
    }
    makerFee {
      ...currencyAmountFields
    }
    takerFee {
      ...currencyAmountFields
    }
  }
  ${CURRENCY_PRICE_FRAGMENT}
  ${CURRENCY_AMOUNT_FRAGMENT}
`
