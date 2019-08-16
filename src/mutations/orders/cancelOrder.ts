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
