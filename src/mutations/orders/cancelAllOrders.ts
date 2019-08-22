import gql from 'graphql-tag'

export const CANCEL_ALL_ORDERS_MUTATION = gql`
  mutation cancelAllOrders(
    $payload: CancelAllOrdersParams!
    $signature: Signature!
  ) {
    cancelAllOrders(payload: $payload, signature: $signature) {
      accepted
    }
  }
`
