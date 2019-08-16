import gql from 'graphql-tag'

import {
  CURRENCY_AMOUNT_FRAGMENT,
  CURRENCY_PRICE_FRAGMENT
} from '../../currency/fragments'
import { MARKET_FRAGMENT } from './marketFragment'

export const TICKER_FRAGMENT = gql`
  fragment tickerFields on Ticker {
    market {
      ...marketFields
    }
    priceChange24hPct
    volume24h {
      ...currencyAmountFields
    }
    lastPrice {
      ...currencyPriceFields
    }
    usdLastPrice {
      ...currencyPriceFields
    }
  }
  ${CURRENCY_AMOUNT_FRAGMENT}
  ${CURRENCY_PRICE_FRAGMENT}
  ${MARKET_FRAGMENT}
`
