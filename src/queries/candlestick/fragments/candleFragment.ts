import gql from 'graphql-tag'

import { CURRENCY_AMOUNT_PARTIAL_FRAGMENT } from './currencyAmountFragment'

import { CURRENCY_PRICE_PARTIAL_FRAGMENT } from './currencyPriceFragment'

export const CANDLE_FRAGMENT = gql`
  fragment candleFields on Candle {
    aVolume {
      ...currencyAmountPartialFields
    }
    closePrice {
      ...currencyPricePartialFields
    }
    highPrice {
      ...currencyPricePartialFields
    }
    interval
    intervalStartingAt
    lowPrice {
      ...currencyPricePartialFields
    }
    openPrice {
      ...currencyPricePartialFields
    }
  }
  ${CURRENCY_AMOUNT_PARTIAL_FRAGMENT}
  ${CURRENCY_PRICE_PARTIAL_FRAGMENT}
`
