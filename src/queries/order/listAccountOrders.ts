import gql from 'graphql-tag'

import { ORDER_FRAGMENT } from './fragments'
import { TRADE_FRAGMENT } from '../market/fragments'

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
      }
    }
  }
  ${ORDER_FRAGMENT}
`

export const LIST_ACCOUNT_ORDERS_WITH_TRADES = gql`
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
