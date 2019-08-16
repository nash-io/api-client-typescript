import gql from 'graphql-tag'

import { TRADE_FRAGMENT } from './fragments'

export const LIST_TRADES = gql`
  query ListTrades($marketName: MarketName!, $limit: Int, $before: DateTime) {
    listTrades(marketName: $marketName, limit: $limit, before: $before) {
      trades {
        ...tradeFields
      }
      next
    }
  }
  ${TRADE_FRAGMENT}
`
