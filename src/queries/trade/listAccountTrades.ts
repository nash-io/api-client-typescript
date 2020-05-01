import gql from 'graphql-tag'

import { TRADE_FRAGMENT } from '../market/fragments'
import { PaginationCursor } from '../../types'
export const LIST_ACCOUNT_TRADES = gql`
  query ListAccountTrades($payload: ListAccountTradesParams!) {
    listAccountTrades(payload: $payload) {
      next
      trades {
        ...tradeFields
      }
    }
  }
  ${TRADE_FRAGMENT}
`

export interface ListAccountTradeParams {
  before?: PaginationCursor
  limit?: number
  marketName?: string
}
