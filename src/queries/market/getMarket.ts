import gql from 'graphql-tag'

import { MARKET_FRAGMENT } from './fragments'

export const GET_MARKET_QUERY = gql`
  query GetMarket($marketName: MarketName!) {
    getMarket(marketName: $marketName) {
      ...marketFields
    }
  }
  ${MARKET_FRAGMENT}
`