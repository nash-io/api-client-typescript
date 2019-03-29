import gql from 'graphql-tag'

import { ORDER_FRAGMENT } from './fragments'

export const LIST_ORDERS = gql`
  query ListOrders(
    $before: DateTime
    $limit: Int
    $marketName: MarketName
    $status: OrderStatus
  ) {
    listOrders(
      before: $before
      limit: $limit
      marketName: $marketName
      status: $status
    ) {
      next
      orders {
        ...orderFields
      }
    }
  }
  ${ORDER_FRAGMENT}
`