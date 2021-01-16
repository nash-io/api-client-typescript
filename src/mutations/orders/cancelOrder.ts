import gql from 'graphql-tag'

import { CANCELED_ORDER_FRAGMENT } from '../orders/fragments'

export const CANCEL_ORDER_MUTATION = gql`
  mutation cancelOrder($payload: CancelOrderParams!, $signature: Signature!) {
    cancelOrder(payload: $payload, signature: $signature) {
      ...canceledOrderFields
    }
  }
  ${CANCELED_ORDER_FRAGMENT}
`

export const CANCEL_ORDERS_MUTATION = gql`
  mutation cancelOrders(
    $pA: CancelOrderParams!
    $pB: CancelOrderParams!
    $sA: Signature!
    $sB: Signature!
  ) {
    a: cancelOrder(payload: $pA, signature: $sA) {
      orderId
    }
    b: cancelOrder(payload: $pB, signature: $sB) {
      orderId
    }
  }
`
