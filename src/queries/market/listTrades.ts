import gql from 'graphql-tag'

import { TRADE_FRAGMENT } from './fragments'
import { PaginationCursor } from '../../types'

export const LIST_TRADES = gql`
  query ListTrades(
    $marketName: MarketName!
    $limit: Int
    $before: PaginationCursor
  ) {
    listTrades(marketName: $marketName, limit: $limit, before: $before) {
      trades {
        ...tradeFields
      }
      next
    }
  }
  ${TRADE_FRAGMENT}
`

export interface ListTradeParams {
  marketName: string
  limit?: number
  before?: PaginationCursor
}
