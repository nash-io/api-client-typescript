import gql from 'graphql-tag'

import { ORDER_FRAGMENT } from './fragments'
import { TRADE_FRAGMENT } from '../market/fragments'
import {
  PaginationCursor,
  OrderBuyOrSell,
  DateTime,
  OrderStatus,
  OrderType
} from '../../types'
export const LIST_ACCOUNT_ORDERS = gql`
  query ListAccountOrders($payload: ListAccountOrdersParams!) {
    listAccountOrders(payload: $payload) {
      next
      orders {
        ...orderFields
      }
    }
  }
  ${ORDER_FRAGMENT}
`

export const LIST_ACCOUNT_ORDERS_WITH_TRADES = gql`
  query ListAccountOrders($payload: ListAccountOrdersParams!) {
    listAccountOrders(payload: $payload) {
      next
      orders {
        ...orderFields
        trades {
          ...tradeFields
        }
      }
    }
  }
  ${ORDER_FRAGMENT}
  ${TRADE_FRAGMENT}
`

export interface ListAccountOrderParams {
  before?: PaginationCursor
  buyOrSell?: OrderBuyOrSell
  limit?: number
  marketName?: string
  rangeStart?: DateTime
  rangeStop?: DateTime
  status?: [OrderStatus]
  type?: [OrderType]
  shouldIncludeTrades?: boolean
}
