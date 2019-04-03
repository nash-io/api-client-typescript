import gql from 'graphql-tag'

import { DateTime, Signature, PaginationCursor } from '../../types'
import { ORDER_FRAGMENT } from './fragments'
import {
  OrderStatus,
  Order,
  OrderBuyOrSell,
  OrderType
} from '../../types'

import { TRADE_FRAGMENT, Trade } from '../market/fragments'

export const LIST_ACCOUNT_ORDERS = gql`
  query ListAccountOrders(
    $payload: ListAccountOrdersParams!
    $signature: Signature
  ) {
    listAccountOrders(payload: $payload, signature: $signature)
      @connection(key: "listAccountOrders") {
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

// TODO: what's a better way to organize this? We will sometimes fetch trades
// when fetching orders, but not all the time as it's a lot of data. It seems
// we will mostly do this for accounts, as that's when you want to see trades.
export interface AccountOrder extends Order {
  trades: Trade[]
}

export interface ListAccountOrdersVariables {
  payload: {
    before?: PaginationCursor
    buyOrSell?: OrderBuyOrSell
    limit?: number
    marketName?: string
    rangeStart?: DateTime
    rangeStop?: DateTime
    status?: OrderStatus[]
    timestamp: number
    type?: OrderType[]
  }
  signature: Signature
}