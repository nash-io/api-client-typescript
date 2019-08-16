import gql from 'graphql-tag'

import { TICKER_FRAGMENT } from './fragments'

export const GET_TICKER = gql`
  query GetTicker($marketName: MarketName!) {
    getTicker(marketName: $marketName) {
      ...tickerFields
    }
  }
  ${TICKER_FRAGMENT}
`
