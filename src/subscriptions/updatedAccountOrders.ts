import gql from 'graphql-tag'
import { ORDER_FRAGMENT } from '../queries/order/fragments'
export const UPDATED_ACCOUNT_ORDERS = gql`
  subscription UpdatedAccountOrders(
    $payload: UpdatedAccountOrdersParams!
    $signature: Signature!
  ) {
    updatedAccountOrders(payload: $payload, signature: $signature) {
      ...orderFields
    }
  }
  ${ORDER_FRAGMENT}
`
