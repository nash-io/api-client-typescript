import gql from 'graphql-tag'

import { CANCELED_ORDER_FRAGMENT } from './fragments'

export const CANCEL_ALL_ORDERS_MUTATION = gql`
  mutation cancelAllOrders($marketName: MarketName!, $signature: Signature!) {
    cancelAllOrders(marketName: $marketName, signature: $signature) {
      orders {
        ...canceledOrderFields
      }
    }
  }
  ${CANCELED_ORDER_FRAGMENT}
`
